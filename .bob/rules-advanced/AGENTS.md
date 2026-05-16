# Project Advanced Coding Rules (Non-Obvious Only)

## Partial Refactoring (Critical)
- **server.js was refactored** to use services/pricing.js (lines 70, 92) for pricing logic
- **Old duplicated code NOT removed**: utils.js and helpers.js still have unused tax/coupon functions
- This creates a confusing state: new code uses centralized service, old utility functions are dead code

## Dead Code (Intentional)
- utils.js exports formatCurrency(), generateId(), calculateShipping() - never used anywhere
- utils.js also has unused calcTax() and applyCoupon() - replaced by services/pricing.js
- helpers.js has unused calculateTax() and getDiscount() - also replaced
- Do not remove - part of intentional technical debt for demo

## Competing Utility Files
- utils.js and helpers.js have overlapping responsibilities by design
- Same logic with different names: calcTax vs calculateTax, checkFields vs validateRequired
- No clear separation - intentional anti-pattern for demo purposes

## Validation Incompatibility
- utils.js:4-8 validateRequired() checks for falsy values
- helpers.js:4-5 checkFields() checks for undefined AND empty string
- Different behavior by design - intentional inconsistency

## Security Anti-Patterns (Intentional)
- Plain text passwords (server.js:15) - do not "fix"
- No authentication on POST /products (server.js:43) - intentional
- No token/session management - part of demo design