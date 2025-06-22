// Privacy utilities for differential privacy implementation

export interface PrivacyConfig {
  epsilon: number; // Privacy parameter
  delta?: number; // For (ε,δ)-differential privacy
  sensitivity: number; // Sensitivity of the query
  mechanism: 'laplace' | 'gaussian' | 'exponential';
}

/**
 * Generate Laplace noise for differential privacy
 * @param scale Scale parameter (sensitivity / epsilon)
 * @returns Random noise value
 */
export function generateLaplaceNoise(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Generate Gaussian noise for differential privacy
 * @param sigma Standard deviation parameter
 * @returns Random noise value
 */
export function generateGaussianNoise(sigma: number): number {
  // Box-Muller transform for Gaussian noise
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return sigma * z0;
}

/**
 * Add differential privacy noise to a numeric value
 * @param value Original value
 * @param config Privacy configuration
 * @returns Noisy value
 */
export function addPrivacyNoise(value: number, config: PrivacyConfig): number {
  const { epsilon, sensitivity, mechanism } = config;
  
  switch (mechanism) {
    case 'laplace':
      const laplaceScale = sensitivity / epsilon;
      return value + generateLaplaceNoise(laplaceScale);
      
    case 'gaussian':
      if (!config.delta) {
        throw new Error('Delta parameter required for Gaussian mechanism');
      }
      const sigma = Math.sqrt(2 * Math.log(1.25 / config.delta)) * sensitivity / epsilon;
      return value + generateGaussianNoise(sigma);
      
    case 'exponential':
      // Simplified exponential mechanism (for demonstration)
      const expNoise = generateLaplaceNoise(sensitivity / epsilon);
      return value + expNoise;
      
    default:
      throw new Error(`Unknown privacy mechanism: ${mechanism}`);
  }
}

/**
 * Apply differential privacy to an object with numeric values
 * @param data Object containing numeric data
 * @param config Privacy configuration
 * @returns Object with noisy data
 */
export function privatizeData<T extends Record<string, any>>(
  data: T, 
  config: PrivacyConfig
): T {
  const privatizedData = { ...data };
  
  for (const [key, value] of Object.entries(privatizedData)) {
    if (typeof value === 'number') {
      privatizedData[key] = Math.max(0, addPrivacyNoise(value, config));
    }
  }
  
  return privatizedData;
}

/**
 * Calculate privacy budget consumption
 * @param queries Number of queries
 * @param epsilon Privacy parameter per query
 * @returns Total privacy budget consumed
 */
export function calculatePrivacyBudget(queries: number, epsilon: number): number {
  return queries * epsilon;
}

/**
 * Check if privacy budget is exceeded
 * @param totalEpsilon Total epsilon consumed
 * @param maxEpsilon Maximum allowed epsilon
 * @returns Whether budget is exceeded
 */
export function isPrivacyBudgetExceeded(totalEpsilon: number, maxEpsilon: number): boolean {
  return totalEpsilon > maxEpsilon;
}

/**
 * Temporal privacy utility for time-series data
 * Adds correlated noise to maintain temporal patterns
 */
export class TemporalPrivacy {
  private previousNoise: number = 0;
  private correlation: number;
  
  constructor(correlation: number = 0.8) {
    this.correlation = correlation;
  }
  
  addCorrelatedNoise(value: number, config: PrivacyConfig): number {
    const freshNoise = generateLaplaceNoise(config.sensitivity / config.epsilon);
    const correlatedNoise = this.correlation * this.previousNoise + 
                           Math.sqrt(1 - this.correlation ** 2) * freshNoise;
    
    this.previousNoise = correlatedNoise;
    return value + correlatedNoise;
  }
  
  reset(): void {
    this.previousNoise = 0;
  }
}

/**
 * Privacy accounting for composition of multiple mechanisms
 */
export class PrivacyAccountant {
  private totalEpsilon: number = 0;
  private totalDelta: number = 0;
  private queries: Array<{ epsilon: number; delta: number; timestamp: Date }> = [];
  
  addQuery(epsilon: number, delta: number = 0): void {
    this.totalEpsilon += epsilon;
    this.totalDelta += delta;
    this.queries.push({
      epsilon,
      delta,
      timestamp: new Date(),
    });
  }
  
  getTotalPrivacyLoss(): { epsilon: number; delta: number } {
    return {
      epsilon: this.totalEpsilon,
      delta: this.totalDelta,
    };
  }
  
  getRemainingBudget(maxEpsilon: number, maxDelta: number = 0): { epsilon: number; delta: number } {
    return {
      epsilon: Math.max(0, maxEpsilon - this.totalEpsilon),
      delta: Math.max(0, maxDelta - this.totalDelta),
    };
  }
  
  canExecuteQuery(epsilon: number, delta: number = 0, maxEpsilon: number, maxDelta: number = 0): boolean {
    return (this.totalEpsilon + epsilon <= maxEpsilon) && 
           (this.totalDelta + delta <= maxDelta);
  }
  
  getQueryHistory(): Array<{ epsilon: number; delta: number; timestamp: Date }> {
    return [...this.queries];
  }
  
  reset(): void {
    this.totalEpsilon = 0;
    this.totalDelta = 0;
    this.queries = [];
  }
}

// Default privacy configurations for different use cases
export const PRIVACY_PRESETS = {
  HIGH_PRIVACY: {
    epsilon: 0.1,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
  BALANCED: {
    epsilon: 1.0,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
  HIGH_UTILITY: {
    epsilon: 5.0,
    sensitivity: 1.0,
    mechanism: 'laplace' as const,
  },
} as const;