# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to `dist/` directory and copies assets
- **Test**: `npm run test` - Runs AVA test suite with TypeScript compilation
- **Lint**: `npm run lint` - Runs XO linter with auto-fix
- **Format**: `npm run format` - Runs XO with Prettier formatting
- **Package**: `npm run zip` - Creates distribution zip file for Chrome Web Store

## Architecture Overview

This is a Chrome extension (Manifest V3) that automatically injects Amazon affiliate tags into URLs when users navigate to supported sites.

### Core Components

**Background Service Worker** (`background.ts`):
- Entry point that initializes the NavigationHandler
- Listens for `chrome.webNavigation.onBeforeNavigate` events
- Supports 6 Amazon domains (amazon.de, .com, .fr, .it, .es, .co.uk)
- Contains bundled code for Chrome extension compatibility (no ES6 modules)

**NavigationHandler** (`navigation-handler.ts`):
- Main business logic for URL modification
- Validates supported websites and URL patterns
- Generates affiliate links with tag parameter injection
- Uses hardcoded affiliate IDs (monzonline-* pattern)
- Performs tab redirects when URLs are modified

**Validator** (`validator.ts`):
- Checks if websites are supported
- Validates Amazon URLs (product pages, search pages)
- Excludes signin and SSPA click pages

**WebsiteRepository** (`website-repository.ts`):
- Manages the list of supported websites
- Provides abstraction over WebsiteData array

### Key Patterns

- **Dependency Injection**: Components receive dependencies via constructor
- **URL Manipulation**: Uses native URL API for parsing and modifying URLs
- **Chrome Extension APIs**: webNavigation API for URL interception, tabs API for redirects
- **Error Handling**: Graceful fallbacks return original URLs on errors

### Test Strategy

- Uses AVA test framework with TypeScript support
- Integration tests in `navgation-handler.int.test.ts` (note typo in filename)
- Unit tests for individual components
- Tests run with compilation to `dist/` directory
- Uses Sinon for mocking Chrome APIs in tests

### Build Process

- TypeScript compilation with target ES2015 for Chrome compatibility
- Assets (HTML, JSON, PNG) copied to `dist/` via copyfiles
- XO linter with Prettier integration for code formatting
- Bestzip for creating distribution packages

### Extension Architecture

- **Manifest V3**: Uses service worker instead of background pages
- **Host Permissions**: Limited to specific Amazon domains for security
- **No Storage API**: Affiliate IDs are hardcoded in the extension
- **URL Pattern Matching**: Validates product pages (`/dp/`, `/gp/product/`) and search pages (`/s` with `k=` parameter)