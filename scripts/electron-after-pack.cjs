'use strict'

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('node:path')
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')

const ARCH_NAMES = { 0: 'ia32', 1: 'x64', 2: 'armv7l', 3: 'arm64', 4: 'universal' }

// Native modules that live in .next/standalone/node_modules and load inside the
// Electron child process. Root node_modules are already rebuilt for the target
// Electron ABI by electron-builder's @electron/rebuild pass before this hook
// fires, so copying those .node files into the packaged standalone is the most
// reliable way to keep the two trees in sync per architecture.
const NATIVE_MODULES = [
  'better-sqlite3',
  '@mongodb-js/zstd',
  'node-liblzma',
  'utf-8-validate',
]
const REQUIRED_SYNC_MODULES = new Set(['better-sqlite3'])

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return false
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  return true
}

function syncNativeBuildDir(rootPkgDir, standalonePkgDir) {
  if (!fs.existsSync(rootPkgDir) || !fs.existsSync(standalonePkgDir)) return false
  const rootBuild = path.join(rootPkgDir, 'build', 'Release')
  const standaloneBuild = path.join(standalonePkgDir, 'build', 'Release')
  if (!fs.existsSync(rootBuild)) return false
  fs.mkdirSync(standaloneBuild, { recursive: true })
  let synced = false
  for (const entry of fs.readdirSync(rootBuild)) {
    if (!entry.endsWith('.node')) continue
    copyIfExists(path.join(rootBuild, entry), path.join(standaloneBuild, entry))
    synced = true
  }
  return synced
}

function resolveResourcesDir(context) {
  const appName = context.packager.appInfo.productFilename
  if (context.electronPlatformName === 'darwin') {
    return path.join(context.appOutDir, `${appName}.app`, 'Contents', 'Resources')
  }
  return path.join(context.appOutDir, 'resources')
}

function signMacApp(context) {
  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(context.appOutDir, `${appName}.app`)

  console.log(`[after-pack] ad-hoc signing ${appPath}`)
  const codesign = spawnSync(
    'codesign',
    [
      '--sign', '-',
      '--force',
      '--deep',
      '--timestamp=none',
      '--preserve-metadata=entitlements,requirements,flags,runtime',
      appPath,
    ],
    { stdio: 'inherit' },
  )
  if (codesign.status !== 0) {
    throw new Error(`afterPack: codesign ad-hoc failed with status ${codesign.status}`)
  }
}

exports.default = async function afterPack(context) {
  const projectDir = context.packager.info.projectDir
  const standaloneNodeModules = path.join(resolveResourcesDir(context), '.next', 'standalone', 'node_modules')
  const rootNodeModules = path.join(projectDir, 'node_modules')
  const archName = ARCH_NAMES[context.arch]
  if (!archName) throw new Error(`afterPack: unknown arch ${context.arch}`)

  console.log(`[after-pack] syncing native modules into standalone for arch=${archName}`)
  for (const moduleName of NATIVE_MODULES) {
    const rootPkg = path.join(rootNodeModules, moduleName)
    const standalonePkg = path.join(standaloneNodeModules, moduleName)
    const synced = syncNativeBuildDir(rootPkg, standalonePkg)
    console.log(`[after-pack]   ${moduleName}: ${synced ? 'synced' : 'skipped'}`)
    if (!synced && REQUIRED_SYNC_MODULES.has(moduleName) && fs.existsSync(standalonePkg)) {
      throw new Error(`afterPack: failed to sync required native module ${moduleName}`)
    }
  }

  if (context.electronPlatformName === 'darwin') signMacApp(context)
}
