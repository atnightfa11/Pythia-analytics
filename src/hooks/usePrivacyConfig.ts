import { useEffect, useState } from 'react'

export interface CostEntry { maxEpsilon: number; multiplier: number }
export interface PrivacyConfigFile {
  dailyMax: number
  epsilonCostMap: CostEntry[]
}

export const usePrivacyConfig = () => {
  const [config, setConfig] = useState<PrivacyConfigFile | null>(null)

  useEffect(() => {
    fetch('/privacy-config.json')
      .then(r => r.json())
      .then(setConfig)
      .catch(err => {
        console.warn('Failed to load privacy config – falling back to defaults', err)
        setConfig({
          dailyMax: 2.0,
          epsilonCostMap: [
            { maxEpsilon: 0.5, multiplier: 2.0 },
            { maxEpsilon: 1.0, multiplier: 1.5 },
            { maxEpsilon: 1.5, multiplier: 1.2 },
            { maxEpsilon: 9999, multiplier: 1.0 },
          ],
        })
      })
  }, [])

  return config
}


