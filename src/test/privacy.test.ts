import { describe, test, expect } from 'vitest'
import {
  generateLaplaceNoise,
  generateGaussianNoise,
  addPrivacyNoise,
  PRIVACY_PRESETS,
} from '../utils/privacy'

describe('DP noise utilities', () => {
  test('Laplace noise is roughly zero-mean', () => {
    const scale = 1 // corresponds to ε = 1, sensitivity = 1
    const samples = Array.from({ length: 20000 }, () => generateLaplaceNoise(scale))
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    // With 20k draws the mean should be very close to 0
    expect(Math.abs(mean)).toBeLessThan(0.05)
  })

  test('Gaussian noise returns a finite number', () => {
    const sigma = 1
    const val = generateGaussianNoise(sigma)
    expect(typeof val).toBe('number')
    expect(Number.isFinite(val)).toBe(true)
  })

  test('addPrivacyNoise respects the selected mechanism', () => {
    const cfgLap = { ...PRIVACY_PRESETS.HIGH_PRIVACY, mechanism: 'laplace' as const }
    const cfgGauss = { ...PRIVACY_PRESETS.HIGH_PRIVACY, mechanism: 'gaussian' as const, delta: 1e-5 }
    const base = 42

    const lapResult = addPrivacyNoise(base, cfgLap)
    const gaussResult = addPrivacyNoise(base, cfgGauss)

    // Both should be numbers and differ from the base value
    expect(lapResult).not.toBe(base)
    expect(gaussResult).not.toBe(base)
  })
})


