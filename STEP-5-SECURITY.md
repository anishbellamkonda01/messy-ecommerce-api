# Step 5: Add Basic Security Improvements - Detailed Plan

## Overview

This step adds essential security features to the API, including password hashing, input sanitization, authentication, and rate limiting.

⚠️ **WARNING:** This step includes **BREAKING CHANGES** - existing users will need to re-register due to password hashing.

---

## 5.1 Add Password Hashing

### Install Dependencies

```bash
npm install bcrypt
```

### Update package.json

After installation, [`package.json`](package.json) should include:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1"
  }
}
```

### Update User Service

**File:** [`services/user.js`](services/user.js)

**Changes:**

```javascript
// services/user.js
const bcrypt = require('bcrypt');

class UserService {
  constructor() {
    this.users = [];
    this.SALT_ROUNDS = 10; // bcrypt salt rounds
  }

  /**
   * Register a new user with hashed password
   * @param {Object} userData - { email, password, name }
   * @returns {Promise<Object>} Created user (without password)
   * @throws {Error} If email already registered
   */
  async register(userData) {
    const { email, password, name } = userData;
    
    // Check if email already exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    
    const user = {
      id: this.users.length + 1,
      email,
      password: hashedPassword, // Now hashed!
      name,
      created: new Date()
    };
    
    this.users.push(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticate user with password comparison
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User (without password) if authenticated, null otherwise
   */
  async login(email, password) {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;
    
    // Compare hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // ... other methods unchanged
}

module.exports = new UserService();
```

**Key Changes:**
- ✅ `register()` now async, hashes password
- ✅ `login()` now async, compares hashed password
- ✅ User objects returned without password field
- ⚠️ **BREAKING:** Existing plain text passwords won't work

### Update User Routes

**File:** [`routes/users.js`](routes/users.js)

**Changes:**

```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const userService = require('../services/user');
const validationService = require('../services/validation');

// POST /register - NOW ASYNC
router.post('/register', async (req, res) => {
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
  
  try {
    const user = await userService.register({ email, password, name });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /login - NOW ASYNC
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  const validation = validationService.validateRequired(['email', 'password'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: validation.missing 
    });
  }
  
  const user = await userService.login(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, user });
});

module.exports = router;
```

**Behavior Changes:**
- ⚠️ Routes now async (return Promises)
- ✅ Passwords hashed in database
- ✅ User responses no longer include password
- ⚠️ **BREAKING:** Existing users can't login (passwords are plain text)

### Migration Strategy

**Option 1: Clear All Users (Recommended for Demo)**
```javascript
// Add to UserService constructor
constructor() {
  this.users = []; // Start fresh
  this.SALT_ROUNDS = 10;
  console.log('⚠️  User database cleared for password hashing migration');
}
```

**Option 2: Migration Script (Production Approach)**
```javascript
// migration/hash-passwords.js
const bcrypt = require('bcrypt');
const userService = require('../services/user');

async function migratePasswords() {
  for (const user of userService.users) {
    // Check if password is already hashed (starts with $2b$)
    if (!user.password.startsWith('$2b$')) {
      user.password = await bcrypt.hash(user.password, 10);
      console.log(`Migrated password for user ${user.email}`);
    }
  }
}

migratePasswords().then(() => console.log('Migration complete'));
```

---

## 5.2 Add Input Sanitization

### Install Dependencies

```bash
npm install validator
```

### Update Validation Service

**File:** [`services/validation.js`](services/validation.js)

**Add to top:**
```javascript
const validator = require('validator');
```

**Add new methods:**
```javascript
/**
 * Sanitize string input (trim and escape HTML)
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
sanitizeString(input) {
  if (typeof input !== 'string') return input;
  return validator.escape(validator.trim(input));
}

/**
 * Validate and normalize email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = validator.normalizeEmail(email);
  return validator.isEmail(normalized || email);
}

/**
 * Sanitize all string fields in an object
 * @param {Object} data - Object with fields to sanitize
 * @returns {Object} Object with sanitized string fields
 */
sanitizeInput(data) {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = this.sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
```

### Update Routes to Sanitize Input

**Example for [`routes/users.js`](routes/users.js):**

```javascript
router.post('/register', async (req, res) => {
  // Sanitize input FIRST
  const sanitized = validationService.sanitizeInput(req.body);
  const { email, password, name } = sanitized;
  
  // Then validate...
  // Rest of code unchanged
});
```

**Apply to all routes:**
- [`routes/users.js`](routes/users.js) - register, login
- [`routes/products.js`](routes/products.js) - create product
- [`routes/orders.js`](routes/orders.js) - create order

---

## 5.3 Add Authentication Middleware

### Create Auth Middleware

**File:** [`middleware/auth.js`](middleware/auth.js) (NEW)

```javascript
// middleware/auth.js
// Simple token-based authentication (not production-ready)

// In-memory token storage (use Redis in production)
const tokens = new Map();

/**
 * Generate authentication token
 * @param {number} userId - User ID
 * @returns {string} Authentication token
 */
function generateToken(userId) {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  tokens.set(token, {
    userId,
    created: Date.now()
  });
  return token;
}

/**
 * Verify authentication token
 * @param {string} token - Token to verify
 * @returns {number|null} User ID if valid, null if invalid/expired
 */
function verifyToken(token) {
  const data = tokens.get(token);
  if (!data) return null;
  
  // Token expires after 24 hours
  const age = Date.now() - data.created;
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  if (age > MAX_AGE) {
    tokens.delete(token);
    return null;
  }
  
  return data.userId;
}

/**
 * Revoke authentication token
 * @param {string} token - Token to revoke
 */
function revokeToken(token) {
  tokens.delete(token);
}

/**
 * Express middleware to require authentication
 */
function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide an authorization token'
    });
  }
  
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      message: 'Please login again'
    });
  }
  
  // Attach userId to request for use in route handlers
  req.userId = userId;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  revokeToken,
  requireAuth
};
```

### Update Login Route to Return Token

**File:** [`routes/users.js`](routes/users.js)

```javascript
const { generateToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  // ... validation code ...
  
  const user = await userService.login(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate authentication token
  const token = generateToken(user.id);
  
  res.json({ 
    success: true, 
    user,
    token // Return token to client
  });
});
```

### Protect Product Creation Endpoint

**File:** [`routes/products.js`](routes/products.js)

```javascript
const { requireAuth } = require('../middleware/auth');

// POST /products - NOW REQUIRES AUTHENTICATION
router.post('/', requireAuth, (req, res) => {
  // req.userId is now available from middleware
  const { name, price, category } = req.body;
  
  // ... rest of validation and logic unchanged ...
});
```

### Add Logout Endpoint

**File:** [`routes/users.js`](routes/users.js)

```javascript
const { generateToken, revokeToken, requireAuth } = require('../middleware/auth');

// POST /logout
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers['authorization'];
  revokeToken(token);
  res.json({ success: true, message: 'Logged out successfully' });
});
```

---

## 5.4 Add Rate Limiting

### Install Dependencies

```bash
npm install express-rate-limit
```

### Update server.js

**File:** [`server.js`](server.js)

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

// Middleware
app.use(express.json());

// General rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});

// Strict limiter for auth routes - 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts',
    message: 'Please try again later'
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Import route modules
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/', userRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/analytics', analyticsRoutes);

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
```

### Apply Strict Limiter to Auth Routes

**File:** [`routes/users.js`](routes/users.js)

```javascript
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many attempts',
    message: 'Please try again in 15 minutes'
  }
});

// Apply to login and register
router.post('/register', authLimiter, async (req, res) => {
  // ... existing code ...
});

router.post('/login', authLimiter, async (req, res) => {
  // ... existing code ...
});
```

---

## 5.5 Testing Security Features

### Test Password Hashing

```bash
# Register a new user
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"secure@test.com","password":"SecurePass123","name":"Secure User"}'

# Response should NOT include password field
# {"success":true,"user":{"id":1,"email":"secure@test.com","name":"Secure User","created":"..."}}

# Login with correct password
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secure@test.com","password":"SecurePass123"}'

# Should return token
# {"success":true,"user":{...},"token":"abc123..."}

# Login with wrong password
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secure@test.com","password":"WrongPassword"}'

# Should fail
# {"error":"Invalid credentials"}
```

### Test Authentication

```bash
# Try to create product without token
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":19.99}'

# Should fail with 401
# {"error":"Authentication required","message":"Please provide an authorization token"}

# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secure@test.com","password":"SecurePass123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Create product with token
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"Widget","price":19.99}'

# Should succeed
# {"success":true,"product":{...}}
```

### Test Rate Limiting

```bash
# Try to login 6 times rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done

# 6th request should be rate limited
# {"error":"Too many attempts","message":"Please try again in 15 minutes"}
```

### Test Input Sanitization

```bash
# Try XSS attack in name field
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"xss@test.com","password":"password123","name":"<script>alert(\"XSS\")</script>"}'

# Name should be escaped
# {"success":true,"user":{"name":"<script>alert("XSS")</script>",...}}
```

---

## 5.6 Security Checklist

- [ ] bcrypt installed and configured
- [ ] Passwords hashed with bcrypt (10 salt rounds)
- [ ] User responses never include password field
- [ ] validator library installed
- [ ] All string inputs sanitized
- [ ] Email validation uses validator library
- [ ] Authentication middleware created
- [ ] Login returns authentication token
- [ ] Product creation requires authentication
- [ ] Logout endpoint implemented
- [ ] express-rate-limit installed
- [ ] General rate limiting applied (100 req/15min)
- [ ] Auth rate limiting applied (5 req/15min)
- [ ] All security tests pass

---

## 5.7 Breaking Changes Summary

### For Users

1. **Existing users cannot login**
   - Passwords stored as plain text before Step 5
   - After Step 5, passwords are hashed
   - Solution: Users must re-register

2. **Product creation requires authentication**
   - Before: Anyone could create products
   - After: Must login and provide token
   - Solution: Login first, use token in Authorization header

3. **Rate limiting may block rapid requests**
   - Before: Unlimited requests
   - After: 100 requests per 15 minutes (general), 5 per 15 minutes (auth)
   - Solution: Respect rate limits, implement retry logic

### For Developers

1. **Async/await required for user operations**
   - `userService.register()` now returns Promise
   - `userService.login()` now returns Promise
   - Solution: Use `await` or `.then()`

2. **Token management required**
   - Must store token after login
   - Must send token in Authorization header
   - Must handle token expiration (24 hours)

---

## 5.8 Production Considerations

### What's Still Missing (Out of Scope)

1. **JWT Tokens:** Current implementation uses simple random tokens
2. **Refresh Tokens:** No token refresh mechanism
3. **HTTPS:** Should use HTTPS in production
4. **CORS:** No CORS configuration
5. **Helmet:** No security headers middleware
6. **Database:** Still using in-memory storage
7. **Session Management:** No persistent sessions
8. **Password Reset:** No forgot password flow
9. **Email Verification:** No email confirmation
10. **2FA:** No two-factor authentication

### Recommended Next Steps (Beyond This Plan)

```bash
# Install additional security packages
npm install helmet cors dotenv

# Add to server.js
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet()); // Security headers
app.use(cors()); // CORS configuration
```

---

## 5.9 Success Criteria

- ✅ Passwords hashed with bcrypt
- ✅ No passwords in API responses
- ✅ Input sanitization active
- ✅ Authentication required for sensitive endpoints
- ✅ Token-based auth working
- ✅ Rate limiting active
- ✅ All security tests pass
- ✅ Breaking changes documented
- ✅ Migration path provided

---

## 5.10 Final Verification

```bash
# 1. Install all dependencies
npm install

# 2. Start server
npm start

# 3. Run all tests
node tests/pricing.test.js
node tests/validation.test.js

# 4. Test security features
# - Register new user
# - Login and get token
# - Create product with token
# - Try to create product without token (should fail)
# - Try to login 6 times (should be rate limited)

# 5. Verify no regressions
# - All existing endpoints still work
# - Pricing calculations unchanged
# - Validation still works
# - Error messages appropriate
```

---

**Modernization Complete!** 🎉

The codebase is now:
- ✅ Well-organized (services + routes)
- ✅ Secure (password hashing, auth, rate limiting)
- ✅ Maintainable (clean separation of concerns)
- ✅ Testable (business logic in services)
- ✅ Production-ready (with noted limitations)