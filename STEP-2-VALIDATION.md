# Step 2: Extract Validation Logic - Detailed Plan

## Overview

This step consolidates all validation logic from [`server.js`](server.js), [`utils.js`](utils.js), and [`helpers.js`](helpers.js) into a single [`services/validation.js`](services/validation.js) service.

---

## 2.1 Create Validation Service

**File:** [`services/validation.js`](services/validation.js) (NEW)

**Implementation:**

```javascript
// services/validation.js
// Centralized validation logic for request data

class ValidationService {
  /**
   * Validate that required fields are present and not empty
   * @param {Array<string>} fields - Array of required field names
   * @param {Object} data - Object to validate
   * @returns {Object} { valid: boolean, missing: Array<string> }
   */
  validateRequired(fields, data) {
    const missing = [];
    
    for (const field of fields) {
      // Check for undefined, null, empty string, or whitespace-only
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        missing.push(field);
      }
    }
    
    return {
      valid: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    // Simple email regex - matches most common formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} { valid: boolean, errors: Array<string> }
   */
  validatePassword(password) {
    const errors = [];
    
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
      return { valid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate product price
   * @param {number} price - Price to validate
   * @returns {Object} { valid: boolean, error: string }
   */
  validatePrice(price) {
    if (price === undefined || price === null) {
      return { valid: false, error: 'Price is required' };
    }
    
    const numPrice = Number(price);
    if (isNaN(numPrice)) {
      return { valid: false, error: 'Price must be a number' };
    }
    
    if (numPrice < 0) {
      return { valid: false, error: 'Price cannot be negative' };
    }
    
    return { valid: true };
  }
}

// Export singleton instance
module.exports = new ValidationService();
```

---

## 2.2 Update server.js Routes

### Add Import (Line 3)

```javascript
const express = require('express');
const pricingService = require('./services/pricing');
const validationService = require('./services/validation'); // ADD THIS
```

### Update POST /register (Lines 12-19)

**BEFORE:**
```javascript
app.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  // No validation (bad practice)
  const user = { id: users.length + 1, email, password, name, created: new Date() };
  users.push(user);
  res.json({ success: true, user });
});
```

**AFTER:**
```javascript
app.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // Validate required fields
  const requiredValidation = validationService.validateRequired(['email', 'password', 'name'], req.body);
  if (!requiredValidation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: requiredValidation.missing 
    });
  }
  
  // Validate email format
  if (!validationService.validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Validate password strength
  const passwordValidation = validationService.validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: 'Invalid password', 
      details: passwordValidation.errors 
    });
  }
  
  const user = { id: users.length + 1, email, password, name, created: new Date() };
  users.push(user);
  res.json({ success: true, user });
});
```

### Update POST /login (Lines 21-31)

**BEFORE:**
```javascript
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user });
});
```

**AFTER:**
```javascript
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const validation = validationService.validateRequired(['email', 'password'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: validation.missing 
    });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user });
});
```

### Update POST /products (Lines 38-48)

**BEFORE:**
```javascript
app.post('/products', (req, res) => {
  const { name, price, category } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const product = { id: products.length + 1, name, price, category, created: new Date() };
  products.push(product);
  res.json({ success: true, product });
});
```

**AFTER:**
```javascript
app.post('/products', (req, res) => {
  const { name, price, category } = req.body;
  
  const requiredValidation = validationService.validateRequired(['name', 'price'], req.body);
  if (!requiredValidation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: requiredValidation.missing 
    });
  }
  
  const priceValidation = validationService.validatePrice(price);
  if (!priceValidation.valid) {
    return res.status(400).json({ error: priceValidation.error });
  }
  
  const product = { id: products.length + 1, name, price: Number(price), category, created: new Date() };
  products.push(product);
  res.json({ success: true, product });
});
```

### Update POST /orders (Lines 51-54)

**BEFORE:**
```javascript
app.post('/orders', (req, res) => {
  const { userId, productIds, couponCode } = req.body;
  if (!userId || !productIds) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // ... rest
});
```

**AFTER:**
```javascript
app.post('/orders', (req, res) => {
  const { userId, productIds, couponCode } = req.body;
  
  const validation = validationService.validateRequired(['userId', 'productIds'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: validation.missing 
    });
  }
  
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ error: 'productIds must be an array' });
  }
  // ... rest unchanged
});
```

---

## 2.3 Remove Dead Validation Code

### Update utils.js

**BEFORE:**
```javascript
function validateRequired(fields, body) {
  for (const field of fields) {
    if (!body[field]) return false;
  }
  return true;
}

module.exports = {
  validateRequired,
  logAction
};
```

**AFTER:**
```javascript
module.exports = {
  logAction
};
```

### Delete helpers.js

```bash
rm helpers.js
```

---

## 2.4 Create Validation Tests

**File:** [`tests/validation.test.js`](tests/validation.test.js) (NEW)

```javascript
// tests/validation.test.js
const validationService = require('../services/validation');

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✓ PASS: ${testName}`);
    return true;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    console.log(`  Expected: ${expected}, Actual: ${actual}`);
    return false;
  }
}

function assertDeepEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`✓ PASS: ${testName}`);
    return true;
  } else {
    console.log(`✗ FAIL: ${testName}`);
    console.log(`  Expected: ${expectedStr}`);
    console.log(`  Actual: ${actualStr}`);
    return false;
  }
}

console.log('\n=== Testing services/validation.js ===\n');

let passCount = 0;
let failCount = 0;

// Test validateRequired
console.log('--- Test validateRequired() ---');

let result = validationService.validateRequired(['name', 'email'], { name: 'John', email: 'john@test.com' });
if (assertDeepEqual(result, { valid: true, missing: [] }, 'All fields present')) passCount++; else failCount++;

result = validationService.validateRequired(['name', 'email'], { name: 'John' });
if (assertDeepEqual(result, { valid: false, missing: ['email'] }, 'Missing email')) passCount++; else failCount++;

result = validationService.validateRequired(['name', 'email'], { name: '', email: 'test@test.com' });
if (assertDeepEqual(result, { valid: false, missing: ['name'] }, 'Empty string name')) passCount++; else failCount++;

result = validationService.validateRequired(['name'], { name: '   ' });
if (assertDeepEqual(result, { valid: false, missing: ['name'] }, 'Whitespace-only name')) passCount++; else failCount++;

// Test validateEmail
console.log('\n--- Test validateEmail() ---');

if (assertEqual(validationService.validateEmail('test@example.com'), true, 'Valid email')) passCount++; else failCount++;
if (assertEqual(validationService.validateEmail('invalid'), false, 'Invalid email (no @)')) passCount++; else failCount++;
if (assertEqual(validationService.validateEmail(''), false, 'Empty email')) passCount++; else failCount++;
if (assertEqual(validationService.validateEmail(null), false, 'Null email')) passCount++; else failCount++;

// Test validatePassword
console.log('\n--- Test validatePassword() ---');

result = validationService.validatePassword('password123');
if (assertDeepEqual(result, { valid: true, errors: [] }, 'Valid password')) passCount++; else failCount++;

result = validationService.validatePassword('short');
if (assertEqual(result.valid, false, 'Too short password') && result.errors.length > 0) passCount++; else failCount++;

result = validationService.validatePassword('');
if (assertEqual(result.valid, false, 'Empty password')) passCount++; else failCount++;

// Test validatePrice
console.log('\n--- Test validatePrice() ---');

result = validationService.validatePrice(10.99);
if (assertEqual(result.valid, true, 'Valid price')) passCount++; else failCount++;

result = validationService.validatePrice(0);
if (assertEqual(result.valid, true, 'Zero price (valid)')) passCount++; else failCount++;

result = validationService.validatePrice(-5);
if (assertEqual(result.valid, false, 'Negative price')) passCount++; else failCount++;

result = validationService.validatePrice('abc');
if (assertEqual(result.valid, false, 'Non-numeric price')) passCount++; else failCount++;

result = validationService.validatePrice(null);
if (assertEqual(result.valid, false, 'Null price')) passCount++; else failCount++;

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total: ${passCount + failCount}, Passed: ${passCount}, Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n✓ All tests passed!\n');
  process.exit(0);
} else {
  console.log(`\n✗ ${failCount} test(s) failed\n');
  process.exit(1);
}
```

---

## Edge Cases to Test

1. **Empty request body:** `{}`
2. **Null values:** `{ email: null }`
3. **Undefined values:** `{ email: undefined }`
4. **Empty strings:** `{ email: '' }`
5. **Whitespace-only:** `{ email: '   ' }`
6. **Wrong types:** `{ price: 'abc' }`
7. **Arrays for non-array fields:** `{ email: [] }`
8. **Extra fields:** `{ email: 'test', extra: 'field' }` (should be ignored)

---

## Verification Steps

1. Create [`services/validation.js`](services/validation.js)
2. Update [`server.js`](server.js) with validation service
3. Remove dead code from [`utils.js`](utils.js)
4. Delete [`helpers.js`](helpers.js)
5. Create [`tests/validation.test.js`](tests/validation.test.js)
6. Run tests: `node tests/validation.test.js`
7. Run pricing tests: `node tests/pricing.test.js`
8. Start server: `npm start`
9. Test all endpoints manually

---

## Success Criteria

- ✅ All validation centralized in one service
- ✅ Better error messages (includes missing fields)
- ✅ No dead validation code remains
- ✅ All tests pass
- ✅ Server starts without errors
- ✅ API behavior unchanged (except better errors)