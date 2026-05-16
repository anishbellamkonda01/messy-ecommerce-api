# Messy E-Commerce API

A deliberately messy e-commerce API created for RepoMedic demo purposes, now undergoing systematic refactoring to demonstrate best practices.

## Overview

This is a simple REST API for an e-commerce platform that handles:
- User registration and authentication
- Product management
- Order creation and processing
- Receipt generation
- Revenue analytics

**Note**: This codebase was intentionally created with technical debt, code duplication, and anti-patterns to demonstrate refactoring techniques. It is currently being modernized following a systematic plan.

## Current Status: Refactoring in Progress

✅ **Step 1 Complete**: Pricing logic extracted to services layer  
⏳ **Step 2 Pending**: Extract validation logic  
⏳ **Step 3 Pending**: Separate routes from business logic  
⏳ **Step 4 Pending**: Remove dead code  
⏳ **Step 5 Pending**: Add security improvements  

See [modernization-plan.md](modernization-plan.md) for the complete refactoring roadmap.

## Architecture

### Current Structure (After Step 1)

```
messy-ecommerce-api/
├── services/              # Business logic services (NEW)
│   └── pricing.js        # Centralized pricing calculations
├── tests/                # Test files (NEW)
│   └── pricing.test.js   # Pricing service tests (21 tests)
├── server.js             # Express server and routes (118 lines)
├── utils.js              # Utility functions (contains dead code)
├── helpers.js            # Helper functions (contains dead code)
├── package.json          # Dependencies
├── AGENTS.md             # AI assistant guidance
├── CHANGELOG.md          # Change history
├── modernization-plan.md # Refactoring roadmap
└── README.md             # This file
```

### What Changed in Step 1

**Before:**
- Pricing logic duplicated in 7 locations across 3 files
- Tax and coupon calculations scattered throughout codebase
- No tests for pricing logic
- High risk of inconsistent calculations

**After:**
- Single `services/pricing.js` with all pricing logic
- `server.js` uses centralized pricing service
- 21 comprehensive tests (100% coverage)
- Single source of truth for tax rates and coupons

**Intentionally Left Unchanged** (for demo purposes):
- `utils.js` and `helpers.js` still contain unused pricing functions (dead code)
- Analytics endpoint still uses hardcoded tax rate (line 110)
- No validation service yet
- Business logic still mixed with routes in `server.js`

### Services Layer

The `services/` directory contains business logic extracted from route handlers:

#### `services/pricing.js`
Centralized pricing service that handles all tax and discount calculations.

**API:**
- `calculateTax(amount)` - Calculate 8% tax on any amount
- `applyCoupon(amount, couponCode)` - Apply discount based on coupon code
- `calculateOrderTotal(items, couponCode)` - Calculate complete order total

**Supported Coupon Codes:**
- `SAVE10` - 10% discount
- `SAVE20` - 20% discount
- `HALFOFF` - 50% discount

**Example:**
```javascript
const pricingService = require('./services/pricing');

const items = [
  { name: 'Product 1', price: 50 },
  { name: 'Product 2', price: 30 }
];

const result = pricingService.calculateOrderTotal(items, 'SAVE10');
// Returns: { subtotal: 72, tax: 5.76, total: 77.76 }
```

## API Endpoints

### User Management

**POST /register**
- Register a new user
- Body: `{ email, password, name }`
- Returns: User object
- ⚠️ No validation, plain text passwords (security issues)

**POST /login**
- Login existing user
- Body: `{ email, password }`
- Returns: User object
- ⚠️ No token/session management (security issue)

### Product Management

**GET /products**
- Get all products
- Returns: Array of products

**POST /products**
- Create a new product
- Body: `{ name, price, category }`
- Returns: Created product
- ⚠️ No authentication required (security issue)

### Order Management

**POST /orders**
- Create a new order
- Body: `{ userId, productIds, couponCode? }`
- Returns: Created order with calculated total
- ✅ Uses centralized pricing service

**GET /orders/:id/receipt**
- Get receipt for an order
- Returns: Receipt with itemized pricing
- ✅ Uses centralized pricing service

### Analytics

**GET /analytics/revenue**
- Get revenue statistics
- Returns: `{ totalRevenue, preTaxRevenue, orderCount }`
- ⚠️ Still uses hardcoded tax rate (not yet refactored)

## Installation

```bash
# Install dependencies
npm install

# Run the server
npm start
```

The server will start on port 3000.

## Running Tests

```bash
# Run pricing service tests
node tests/pricing.test.js
```

Expected output:
```
=== Testing services/pricing.js ===
...
✓ All tests passed!
Total tests: 21
Passed: 21
Failed: 0
```

## Development

### Making Changes to Pricing Logic

1. Update `services/pricing.js`
2. Run tests: `node tests/pricing.test.js`
3. Verify all tests pass before committing

### Adding New Coupon Codes

Edit `services/pricing.js`:
```javascript
this.COUPONS = {
  'SAVE10': 0.1,
  'SAVE20': 0.2,
  'HALFOFF': 0.5,
  'NEWCODE': 0.15  // Add new coupon here
};
```

### Changing Tax Rate

Edit `services/pricing.js`:
```javascript
this.TAX_RATE = 0.10;  // Change from 0.08 to 0.10 (10%)
```

**Note:** Analytics endpoint (line 110 in server.js) still uses hardcoded `1.08` and needs manual update.

## Refactoring Progress

### Completed Improvements

✅ **Centralized Pricing Logic**
- Eliminated 7 duplicate implementations
- Single source of truth for tax and coupons
- 100% test coverage (21 tests)
- Reduced code duplication by ~28 lines in server.js

### Known Issues (To Be Fixed)

⚠️ **Security Issues:**
- Passwords stored in plain text (line 15)
- No authentication on product creation (line 38)
- No session/token management (line 29)
- No input validation or sanitization

⚠️ **Architecture Issues:**
- Business logic mixed with route handlers in server.js
- No separation of concerns
- Validation logic duplicated across routes
- Dead code in utils.js and helpers.js

⚠️ **Partial Refactoring:**
- Analytics endpoint uses hardcoded tax rate instead of pricing service
- Old pricing functions still exist in utils.js and helpers.js (unused)

⚠️ **Testing:**
- No integration tests
- No test framework (using console.log assertions)
- Only pricing service has tests

See [modernization-plan.md](modernization-plan.md) for the complete list and remediation plan.

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Data Storage**: In-memory arrays (no database)
- **Testing**: Custom console.log assertions (no framework yet)

## Project Goals

This project demonstrates:
1. **Identifying technical debt** - Recognizing code smells and anti-patterns
2. **Systematic refactoring** - Following a step-by-step modernization plan
3. **Test-driven improvements** - Adding tests before and after changes
4. **Best practices** - Implementing proper separation of concerns
5. **Documentation** - Maintaining clear change history and architecture docs

## What's Next?

The refactoring plan includes 5 steps total. Step 1 is complete:

1. ✅ **Extract Pricing Logic** - Centralize tax and coupon calculations
2. ⏳ **Extract Validation Logic** - Create validation service
3. ⏳ **Separate Routes from Business Logic** - Create service and route layers
4. ⏳ **Remove Dead Code** - Clean up utils.js and helpers.js
5. ⏳ **Add Security** - Password hashing, authentication, rate limiting

Each step is documented in detail:
- [STEP-2-VALIDATION.md](STEP-2-VALIDATION.md)
- [STEP-3-SEPARATION.md](STEP-3-SEPARATION.md)
- [STEP-4-CLEANUP.md](STEP-4-CLEANUP.md)
- [STEP-5-SECURITY.md](STEP-5-SECURITY.md)

## Contributing

This is a demo project for learning purposes. The intentional "messiness" is part of the educational value.

If you're following along with the refactoring:
1. Read [modernization-plan.md](modernization-plan.md)
2. Check [CHANGELOG.md](CHANGELOG.md) for completed steps
3. Follow the plan step-by-step
4. Run tests after each change
5. Document your changes

## License

MIT

## Acknowledgments

Created as a demonstration project for RepoMedic to showcase:
- Code quality analysis
- Refactoring techniques
- Technical debt remediation
- Best practices in API development