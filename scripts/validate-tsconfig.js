#!/usr/bin/env node

/**
 * TypeScript Configuration Validator
 *
 * Validates that all tsconfig files are consistent and follow best practices.
 * Prevents build failures from configuration conflicts.
 *
 * Usage:
 *   node scripts/validate-tsconfig.js
 *   npm run validate-tsconfig
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Expected configuration structure
const EXPECTED_CONFIGS = {
  'tsconfig.json': {
    required: ['files', 'references', 'compilerOptions'],
    extends: false,
    include: false
  },
  'tsconfig.app.json': {
    required: ['extends', 'compilerOptions', 'include'],
    extends: './tsconfig.json',
    include: ['src']
  },
  'tsconfig.node.json': {
    required: ['extends', 'compilerOptions', 'include'],
    extends: './tsconfig.json',
    include: ['vite.config.ts', 'scripts', 'supabase']
  }
}

// Common settings that should be inherited from root
const INHERITED_SETTINGS = [
  'target',
  'module',
  'esModuleInterop',
  'allowSyntheticDefaultImports',
  'forceConsistentCasingInFileNames',
  'strict',
  'skipLibCheck',
  'isolatedModules',
  'noEmit'
]

/**
 * Validate a single tsconfig file
 */
function validateTsConfig(filename) {
  const filePath = path.join(__dirname, '..', filename)

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: [`File not found: ${filename}`],
      warnings: []
    }
  }

  const config = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const expected = EXPECTED_CONFIGS[filename]
  const errors = []
  const warnings = []

  // Check required fields
  if (expected) {
    for (const field of expected.required) {
      if (!(field in config)) {
        errors.push(`Missing required field: ${field}`)
      }
    }
  }

  // Check extends
  if (expected?.extends) {
    if (!config.extends || config.extends !== expected.extends) {
      errors.push(`Must extend '${expected.extends}', found: ${config.extends || 'none'}`)
    }
  } else if (expected?.extends === false && config.extends) {
    errors.push(`Root config should not extend, found: ${config.extends}`)
  }

  // Check include
  if (expected?.include) {
    if (!config.include || !arraysEqual(config.include, expected.include)) {
      warnings.push(`Include should be ${JSON.stringify(expected.include)}, found: ${JSON.stringify(config.include)}`)
    }
  }

  // Check for inherited settings in child configs
  if (filename !== 'tsconfig.json' && config.compilerOptions) {
    for (const setting of INHERITED_SETTINGS) {
      if (config.compilerOptions[setting] !== undefined) {
        warnings.push(`Setting '${setting}' should be inherited from root, not overridden in child config`)
      }
    }
  }

  // Check for consistent target/lib versions
  if (config.compilerOptions?.target && config.compilerOptions?.lib) {
    const target = config.compilerOptions.target
    const lib = config.compilerOptions.lib

    if (target && lib) {
      const targetVersion = target.replace('ES', '')
      const hasMatchingLib = lib.some(libEntry => libEntry.includes(targetVersion))
      if (!hasMatchingLib) {
        warnings.push(`Target '${target}' should be included in lib '${JSON.stringify(lib)}'`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate all tsconfig files
 */
function validateAllTsConfigs() {
  console.log('🔍 Validating TypeScript configuration files...\n')

  let allValid = true
  const allIssues = []

  for (const filename of Object.keys(EXPECTED_CONFIGS)) {
    console.log(`📋 Validating ${filename}...`)
    const result = validateTsConfig(filename)

    if (!result.valid) {
      allValid = false
    }

    if (result.errors.length > 0 || result.warnings.length > 0) {
      result.errors.forEach(error => {
        console.log(`❌ ${filename}: ${error}`)
        allIssues.push({ file: filename, type: 'error', message: error })
      })

      result.warnings.forEach(warning => {
        console.log(`⚠️  ${filename}: ${warning}`)
        allIssues.push({ file: filename, type: 'warning', message: warning })
      })
    } else {
      console.log(`✅ ${filename} - No issues found`)
    }
    console.log('')
  }

  console.log('=' .repeat(60))

  if (allValid) {
    console.log('🎉 All TypeScript configurations are valid!')
  } else {
    console.log('❌ TypeScript configuration validation failed!')
    console.log('\n💡 Fix the configuration issues above')
  }

  console.log('='.repeat(60))

  return allValid
}

/**
 * Generate a summary report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    configs: {},
    recommendations: []
  }

  for (const filename of Object.keys(EXPECTED_CONFIGS)) {
    const result = validateTsConfig(filename)
    report.configs[filename] = result
  }

  // Add recommendations
  if (!report.configs['tsconfig.app.json']?.valid) {
    report.recommendations.push('Fix tsconfig.app.json to properly extend root config')
  }
  if (!report.configs['tsconfig.node.json']?.valid) {
    report.recommendations.push('Fix tsconfig.node.json to properly extend root config')
  }

  return report
}

/**
 * Helper function to compare arrays
 */
function arraysEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const generateReport = process.argv.includes('--report')

  if (generateReport) {
    const report = generateReport()
    console.log(JSON.stringify(report, null, 2))
  } else {
    const success = validateAllTsConfigs()
    process.exit(success ? 0 : 1)
  }
}

export { validateAllTsConfigs, validateTsConfig, generateReport }
