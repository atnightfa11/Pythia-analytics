#!/usr/bin/env node

/**
 * Database Schema Validator for Pythia Analytics
 *
 * This script validates that all Netlify functions use columns that exist
 * in the current database schema, preventing runtime "missing column" errors.
 *
 * Usage:
 *   node supabase/validations/schema-validator.js
 *   npm run validate-schema
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Schema definitions based on migrations
const EXPECTED_SCHEMA = {
  events: {
    id: 'uuid',
    timestamp: 'timestamptz',
    event_type: 'text',
    count: 'integer',
    session_id: 'text',
    device: 'text',
    country: 'text'
  },
  alerts: {
    id: 'uuid',
    type: 'text',
    title: 'text',
    message: 'text',
    timestamp: 'timestamptz',
    severity: 'text',
    data: 'jsonb',
    acknowledged: 'boolean',
    created_at: 'timestamptz',
    acknowledged_at: 'timestamptz'
  },
  forecasts: {
    id: 'uuid',
    created_at: 'timestamptz',
    future: 'jsonb',
    metadata: 'jsonb',
    mape: 'numeric',
    forecast: 'numeric',
    generated_at: 'timestamptz',
    model: 'text',
    events_count_at_generation: 'integer',
    model_version: 'text',
    timestamp: 'timestamptz'
  }
}

// Functions to validate
const NETLIFY_FUNCTIONS = [
  'get-events.js',
  'get-alerts.js',
  'acknowledge-alert.js',
  'alerter.js',
  'get-live-visitors.js',
  'get-metrics.js',
  'forecast.js',
  'ingest.js'
]

/**
 * Extract column references from a JavaScript file for a specific table
 */
function extractColumnReferences(fileContent, tableName) {
  const columns = new Set()

  // Look for query chains that start with the specific table
  // This regex looks for .from('table') followed by method calls
  const queryChainRegex = new RegExp(`\.from\\(['"\`]${tableName}['"\`]\\)([^;]+)`, 'g')
  let match

  while ((match = queryChainRegex.exec(fileContent)) !== null) {
    const queryChain = match[1]

    // Extract columns from .select() calls
    const selectRegex = /\.select\(['"\`]([^'"\`]*)['"\`]/g
    let selectMatch
    while ((selectMatch = selectRegex.exec(queryChain)) !== null) {
      const selectColumns = selectMatch[1]
      if (selectColumns === '*') {
        return ['*'] // Special case for SELECT *
      }
      selectColumns.split(',').forEach(col => {
        columns.add(col.trim())
      })
    }

    // Extract columns from .eq(), .gte(), .lte() calls within this query chain
    const methodRegex = new RegExp(`\\.(${['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'order'].join('|')})\\(['"\`]([^'"\`]*)['"\`]`, 'g')
    let methodMatch
    while ((methodMatch = methodRegex.exec(queryChain)) !== null) {
      const columnName = methodMatch[2].trim()
      // Only add if it's a valid column name (contains underscores, letters, numbers)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName)) {
        columns.add(columnName)
      }
    }

    // Extract columns from .update() calls
    const updateRegex = /\.update\(\s*\{([^}]*)}\s*\)/g
    let updateMatch
    while ((updateMatch = updateRegex.exec(queryChain)) !== null) {
      const updateObj = updateMatch[1]
      const propRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g
      let propMatch
      while ((propMatch = propRegex.exec(updateObj)) !== null) {
        columns.add(propMatch[1].trim())
      }
    }
  }

  return Array.from(columns)
}

/**
 * Validate a single Netlify function
 */
function validateFunction(functionName) {
  const functionPath = path.join(__dirname, '..', '..', 'netlify', 'functions', functionName)

  if (!fs.existsSync(functionPath)) {
    console.warn(`⚠️  Function file not found: ${functionName}`)
    return { valid: true, warnings: [`Function file not found: ${functionName}`] }
  }

  const fileContent = fs.readFileSync(functionPath, 'utf8')
  const issues = []

  for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
    const usedColumns = extractColumnReferences(fileContent, tableName)

    if (usedColumns.length === 0) continue // Function doesn't use this table

    console.log(`🔍 Checking ${functionName} → ${tableName} (${usedColumns.length} columns)`)

    for (const usedColumn of usedColumns) {
      if (usedColumn === '*') continue // SELECT * is allowed

      if (!expectedColumns[usedColumn]) {
        issues.push({
          type: 'error',
          table: tableName,
          column: usedColumn,
          message: `Column '${usedColumn}' not found in ${tableName} schema`
        })
      }
    }
  }

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues
  }
}

/**
 * Validate all Netlify functions
 */
function validateAllFunctions() {
  console.log('🗄️  Starting database schema validation...\n')

  let allValid = true
  const allIssues = []

  for (const functionName of NETLIFY_FUNCTIONS) {
    console.log(`\n📋 Validating ${functionName}...`)
    const result = validateFunction(functionName)

    if (!result.valid) {
      allValid = false
    }

    if (result.issues) {
      result.issues.forEach(issue => {
        allIssues.push({ function: functionName, ...issue })
      })
    }

    if (!result.issues || result.issues.length === 0) {
      console.log(`✅ ${functionName} - No schema issues found`)
    }
  }

  console.log('\n' + '='.repeat(60))

  if (allValid) {
    console.log('🎉 All functions are schema-compliant!')
    console.log('✅ No missing column errors expected in runtime')
  } else {
    console.log('❌ Schema validation failed!')
    console.log('\nIssues found:')
    allIssues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : '⚠️'
      console.log(`${icon} ${issue.function}: ${issue.message}`)
    })
    console.log('\n💡 Fix: Update migrations or function column references')
  }

  console.log('='.repeat(60))

  return allValid
}

/**
 * Generate schema constants file for import
 */
function generateSchemaConstants() {
  const constantsPath = path.join(__dirname, 'schema-constants.js')

  let content = `/**
 * Database Schema Constants
 * Auto-generated by schema-validator.js
 * Do not edit manually - regenerate using: npm run validate-schema
 */

export const TABLES = {
${Object.keys(EXPECTED_SCHEMA).map(table => `  ${table.toUpperCase()}: '${table}'`).join(',\n')}
}

export const COLUMNS = {
${Object.entries(EXPECTED_SCHEMA).map(([table, columns]) => `  ${table.toUpperCase()}: {
${Object.keys(columns).map(col => `    ${col.toUpperCase()}: '${col}'`).join(',\n')}
  }`).join(',\n\n')}
}

export const TYPES = {
${Object.entries(EXPECTED_SCHEMA).map(([table, columns]) => `  ${table.toUpperCase()}: {
${Object.entries(columns).map(([col, type]) => `    ${col.toUpperCase()}: '${type}'`).join(',\n')}
  }`).join(',\n\n')}
}
`

  fs.writeFileSync(constantsPath, content)
  console.log(`📝 Generated schema constants: ${constantsPath}`)
}

/**
 * Add schema version header to a Netlify function
 */
function addSchemaVersionHeader(functionName) {
  const functionPath = path.join(__dirname, '..', '..', 'netlify', 'functions', functionName)

  if (!fs.existsSync(functionPath)) {
    console.warn(`⚠️  Function file not found: ${functionName}`)
    return false
  }

  let fileContent = fs.readFileSync(functionPath, 'utf8')

  // Check if schema version header already exists
  if (fileContent.includes('SCHEMA_VERSION')) {
    console.log(`ℹ️  Schema version header already exists in ${functionName}`)
    return true
  }

  // Add schema version header after imports
  const importEndPattern = /(import\s+.*?\n(?:\s*import\s+.*?\n)*)/
  const versionHeader = `
/**
 * SCHEMA_VERSION: ${new Date().toISOString().split('T')[0]}
 * Auto-generated by schema-validator.js
 * Run 'npm run validate-schema' to ensure schema compliance
 */

`

  fileContent = fileContent.replace(importEndPattern, `$1${versionHeader}`)

  fs.writeFileSync(functionPath, fileContent)
  console.log(`📝 Added schema version header to ${functionName}`)
  return true
}

/**
 * Add schema version headers to all Netlify functions
 */
function addSchemaVersionHeaders() {
  console.log('📝 Adding schema version headers to all functions...\n')

  let success = true
  for (const functionName of NETLIFY_FUNCTIONS) {
    if (!addSchemaVersionHeader(functionName)) {
      success = false
    }
  }

  if (success) {
    console.log('\n✅ All functions updated with schema version headers!')
  } else {
    console.log('\n❌ Some functions could not be updated!')
  }

  return success
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const generateConstants = process.argv.includes('--generate-constants')
  const addHeaders = process.argv.includes('--add-headers')

  if (generateConstants) {
    generateSchemaConstants()
    console.log('✅ Schema constants generated successfully!')
  } else if (addHeaders) {
    const success = addSchemaVersionHeaders()
    process.exit(success ? 0 : 1)
  } else {
    const success = validateAllFunctions()
    process.exit(success ? 0 : 1)
  }
}

export { validateAllFunctions, generateSchemaConstants, addSchemaVersionHeaders, EXPECTED_SCHEMA }
