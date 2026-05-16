# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Context
This is a **deliberately messy** e-commerce API created for RepoMedic demo purposes. The codebase intentionally contains technical debt, code duplication, and anti-patterns.

## Non-Obvious Patterns

### Partial Refactoring (Critical)
- **server.js was refactored** to use services/pricing.js (lines 70, 92) for pricing logic
- **Old duplicated code NOT removed**: utils.js and helpers.js still have unused tax/coupon functions
- This creates a confusing state: new code uses centralized service, old utility functions are dead code

### Dead Code (Intentional)
- utils.js exports unused functions: formatCurrency(), generateId(), calculateShipping()
- utils.js also has unused calcTax() and applyCoupon() - replaced by services/pricing.js
- helpers.js has unused calculateTax() and getDiscount() - also replaced
- These are exported in module.exports but never imported/used anywhere

### Competing Utility Files
- utils.js and helpers.js have overlapping responsibilities
- Same logic with different function names (calcTax vs calculateTax, checkFields vs validateRequired)
- No clear separation of concerns between the two files

### Security Issues (Intentional)
- Passwords stored in plain text (server.js:15)
- No authentication on product creation endpoint (server.js:43)
- No token/session management (server.js:29)

## Commands
- Start server: `npm start` (runs on port 3000)
- Run tests: `node tests/pricing.test.js` (custom console.log-based test framework, no jest/mocha)
- No linter or build process configured