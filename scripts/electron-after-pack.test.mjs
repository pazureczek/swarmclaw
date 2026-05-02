import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'

const require = createRequire(import.meta.url)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { default: afterPack } = require(path.join(repoRoot, 'scripts', 'electron-after-pack.cjs'))

describe('electron afterPack hook', () => {
  it('syncs rebuilt native modules into Linux standalone resources', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'swarmclaw-after-pack-'))
    const projectDir = path.join(tempDir, 'project')
    const appOutDir = path.join(tempDir, 'dist', 'linux-unpacked')
    const rootNative = path.join(projectDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
    const standalonePkg = path.join(appOutDir, 'resources', '.next', 'standalone', 'node_modules', 'better-sqlite3')
    const standaloneNative = path.join(standalonePkg, 'build', 'Release', 'better_sqlite3.node')

    fs.mkdirSync(path.dirname(rootNative), { recursive: true })
    fs.mkdirSync(standalonePkg, { recursive: true })
    fs.writeFileSync(rootNative, 'electron-abi-build')
    fs.mkdirSync(path.dirname(standaloneNative), { recursive: true })
    fs.writeFileSync(standaloneNative, 'host-node-build')

    try {
      await afterPack({
        electronPlatformName: 'linux',
        arch: 1,
        appOutDir,
        packager: {
          info: { projectDir },
          appInfo: { productFilename: 'SwarmClaw' },
        },
      })

      assert.equal(fs.readFileSync(standaloneNative, 'utf8'), 'electron-abi-build')
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
