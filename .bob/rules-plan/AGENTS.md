# Project Architecture Rules (Non-Obvious Only)

## Architectural Anti-Patterns (Intentional)
- Monolithic server.js contains routes, business logic, validation, and in-memory data storage
- No separation of concerns - intentional for demo purposes
- Business logic scattered across server.js, utils.js, and helpers.js with no clear ownership

## Partial Refactoring State (Critical)
- server.js was refactored to use services/pricing.js (lines 70, 92) for pricing calculations
- Old duplicated functions in utils.js and helpers.js were NOT removed
- This creates architectural confusion: new code uses centralized service, old utility functions are orphaned dead code
- Tax rate (0.08) still hardcoded in 3 locations despite services/pricing.js being the source of truth

## Competing Utility Modules
- utils.js and helpers.js both provide tax, validation, and coupon functions
- No clear responsibility boundaries - intentional duplication for demo
- Same functionality with different names and slightly different implementations
- Validation incompatibility: utils.js checks falsy values, helpers.js checks undefined AND empty string

## Data Architecture
- In-memory arrays (users, orders, products) - no persistence layer
- No database, no ORM - data lost on server restart
- Direct array manipulation in route handlers - no repository pattern

## Demo Project Constraints
- This is a deliberately messy codebase for RepoMedic demonstration
- Technical debt and anti-patterns are INTENTIONAL features, not bugs
- Do not plan refactoring to "fix" these issues - they are the point