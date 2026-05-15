import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveCompactionGenerationPreference } from './compaction-generation-preference'

describe('resolveCompactionGenerationPreference', () => {
  it('returns no preference when no compaction provider is configured', () => {
    assert.equal(resolveCompactionGenerationPreference({}), undefined)
    assert.equal(resolveCompactionGenerationPreference({ compactionProvider: '   ' }), undefined)
  })

  it('builds a trimmed compaction model preference from app settings', () => {
    assert.deepEqual(resolveCompactionGenerationPreference({
      compactionProvider: ' ollama ',
      compactionModel: ' llama3.2:3b ',
      compactionCredentialId: ' cred-1 ',
      compactionEndpoint: ' http://localhost:11434 ',
    }), {
      provider: 'ollama',
      model: 'llama3.2:3b',
      credentialId: 'cred-1',
      apiEndpoint: 'http://localhost:11434',
    })
  })
})
