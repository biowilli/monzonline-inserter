#!/usr/bin/env node

import {execSync} from 'child_process'
import {readFileSync, mkdirSync, existsSync} from 'fs'
import path from 'path'

// Function to get unique filename with numbering
function getUniqueFilename(basePath, baseName) {
  let counter = 0
  let filename = baseName
  let fullPath = path.join(basePath, filename)
  
  while (existsSync(fullPath)) {
    counter++
    const nameWithoutExt = baseName.replace('.zip', '')
    filename = `${nameWithoutExt}_${counter}.zip`
    fullPath = path.join(basePath, filename)
  }
  
  return {filename, fullPath}
}

// Read package.json for version
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const version = packageJson.version

// Create date string (YYYY-MM-DD)
const date = new Date().toISOString().split('T')[0]

// Ensure releases directory exists
if (!existsSync('releases')) {
  mkdirSync('releases')
}

console.log('🔨 Building Chrome extension...')
execSync('npm run build', {stdio: 'inherit'})

// Create Chrome ZIP with unique naming
const chromeBaseZipName = `${date}_v${version}_chrome_monzonline-inserter.zip`
const {filename: chromeZipName, fullPath: chromeZipPath} = getUniqueFilename('releases', chromeBaseZipName)

console.log(`📦 Creating Chrome ZIP: ${chromeZipName}`)
execSync(`bestzip "${path.resolve(chromeZipPath)}" *`, {cwd: 'dist', stdio: 'inherit'})

// Create Firefox ZIP with unique naming
const firefoxBaseZipName = `${date}_v${version}_firefox_monzonline-inserter.zip`
const {filename: firefoxZipName, fullPath: firefoxZipPath} = getUniqueFilename('releases', firefoxBaseZipName)

console.log(`🦊 Creating Firefox ZIP: ${firefoxZipName}`)
execSync(`bestzip "${path.resolve(firefoxZipPath)}" *`, {cwd: 'firefox', stdio: 'inherit'})

console.log('✅ Successfully created both ZIP files:')
console.log(`   📁 releases/${chromeZipName}`)
console.log(`   📁 releases/${firefoxZipName}`)