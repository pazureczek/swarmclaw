import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeSupervisorSettings } from './supervisor-settings'

describe('normalizeSupervisorSettings', () => {
  it('preserves and clamps reflection memory quality settings', () => {
    assert.deepEqual(
      {
        minQuality: normalizeSupervisorSettings({ reflectionMinQuality: '0.72' }).reflectionMinQuality,
        minQualityHigh: normalizeSupervisorSettings({ reflectionMinQuality: 2 }).reflectionMinQuality,
        minQualityLow: normalizeSupervisorSettings({ reflectionMinQuality: -1 }).reflectionMinQuality,
        semanticEnabled: normalizeSupervisorSettings({ reflectionSemanticDedupEnabled: 'on' }).reflectionSemanticDedupEnabled,
        semanticThreshold: normalizeSupervisorSettings({ reflectionSemanticDedupThreshold: '0.91' }).reflectionSemanticDedupThreshold,
        semanticThresholdHigh: normalizeSupervisorSettings({ reflectionSemanticDedupThreshold: 1.5 }).reflectionSemanticDedupThreshold,
      },
      {
        minQuality: 0.72,
        minQualityHigh: 1,
        minQualityLow: 0,
        semanticEnabled: true,
        semanticThreshold: 0.91,
        semanticThresholdHigh: 1,
      },
    )
  })
})
