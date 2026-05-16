# Project Documentation Rules (Non-Obvious Only)

## Project Purpose (Critical Context)
- This is a **deliberately messy** codebase for RepoMedic demo purposes
- Technical debt, duplication, and anti-patterns are INTENTIONAL
- Do not suggest "fixing" these issues - they are the point of the demo

## Non-Obvious Code Organization
- All routes, business logic, and data storage in single server.js file (intentional monolith)
- Two competing utility files (utils.js and helpers.js) with overlapping responsibilities
- No separation of concerns - routes contain business logic, validation, and data access

## Partial Refactoring State (Critical)
- server.js was refactored to use services/pricing.js for pricing calculations
- Old duplicated functions in utils.js and helpers.js were NOT removed
- This creates confusing state: new code uses service, old functions are dead code

## Dead Code Context
- utils.js exports 3 unused functions (formatCurrency, generateId, calculateShipping)
- utils.js also has unused calcTax() and applyCoupon() - replaced by services/pricing.js
- helpers.js has unused calculateTax() and getDiscount() - also replaced
- These are intentionally left as dead code for demo purposes

## Testing Context
- Custom test framework using console.log assertions (no jest/mocha)
- Run tests with: `node tests/pricing.test.js`
- Tests only cover services/pricing.js, not the main server endpoints

## Security Context
- Plain text password storage is intentional (server.js:15)
- Missing authentication on endpoints is by design (server.js:43)
- No token/session management is part of the demo scenario