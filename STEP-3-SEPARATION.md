# Step 3: Separate Routes from Business Logic - Detailed Plan

## Overview

This step extracts all business logic from [`server.js`](server.js) into dedicated service classes and creates separate route modules for better organization.

---

## Architecture Diagram

```
Before:
server.js (118 lines)
├── In-memory data (users, orders, products)
├── Route handlers with business logic
└── Express server setup

After:
server.js (~20 lines)
├── Express setup
└── Route mounting

services/
├── pricing.js (already exists)
├── validation.js (from Step 2)
├── user.js (NEW)
├── product.js (NEW)
├── order.js (NEW)
└── analytics.js (NEW)

routes/
├── users.js (NEW)
├── products.js (NEW)
├── orders.js (NEW)
└── analytics.js (NEW)
```

---

## 3.1 Create Service Layer

### 3.1.1 User Service

**File:** [`services/user.js`](services/user.js) (NEW)

```javascript
// services/user.js
// Business logic for user operations

class UserService {
  constructor() {
    this.users = [];
  }

  /**
   * Register a new user
   * @param {Object} userData - { email, password, name }
   * @returns {Object} Created user
   * @throws {Error} If email already registered
   */
  register(userData) {
    const { email, password, name } = userData;
    
    // Check if email already exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('Email already registered');
    }
    
    const user = {
      id: this.users.length + 1,
      email,
      password, // Plain text for now - will fix in Step 5
      name,
      created: new Date()
    };
    
    this.users.push(user);
    return user;
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} User if authenticated, null otherwise
   */
  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    return user || null;
  }

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Object|null} User if found, null otherwise
   */
  findById(userId) {
    return this.users.find(u => u.id === userId) || null;
  }

  /**
   * Get all users
   * @returns {Array} All users
   */
  getAll() {
    return this.users;
  }
}

// Export singleton instance
module.exports = new UserService();
```

**Behavior Preservation:**
- ✅ Same user ID generation (length + 1)
- ✅ Same data structure
- ✅ Same in-memory storage
- ✅ Adds duplicate email check (improvement)

### 3.1.2 Product Service

**File:** [`services/product.js`](services/product.js) (NEW)

```javascript
// services/product.js
// Business logic for product operations

class ProductService {
  constructor() {
    this.products = [];
  }

  /**
   * Create a new product
   * @param {Object} productData - { name, price, category }
   * @returns {Object} Created product
   */
  create(productData) {
    const { name, price, category } = productData;
    
    const product = {
      id: this.products.length + 1,
      name,
      price: Number(price),
      category,
      created: new Date()
    };
    
    this.products.push(product);
    return product;
  }

  /**
   * Get all products
   * @returns {Array} All products
   */
  getAll() {
    return this.products;
  }

  /**
   * Find product by ID
   * @param {number} productId - Product ID
   * @returns {Object|null} Product if found, null otherwise
   */
  findById(productId) {
    return this.products.find(p => p.id === productId) || null;
  }

  /**
   * Find multiple products by IDs
   * @param {Array<number>} productIds - Array of product IDs
   * @returns {Array} Array of found products (skips missing IDs)
   */
  findByIds(productIds) {
    return productIds
      .map(id => this.findById(id))
      .filter(product => product !== null);
  }
}

// Export singleton instance
module.exports = new ProductService();
```

**Behavior Preservation:**
- ✅ Same product ID generation
- ✅ Same data structure
- ✅ Price converted to Number (matches current behavior)
- ✅ Missing products silently skipped in findByIds (matches current loop behavior)

### 3.1.3 Order Service

**File:** [`services/order.js`](services/order.js) (NEW)

```javascript
// services/order.js
// Business logic for order operations

const pricingService = require('./pricing');

class OrderService {
  constructor() {
    this.orders = [];
  }

  /**
   * Create a new order
   * @param {number} userId - User ID
   * @param {Array} items - Array of product objects
   * @param {string} couponCode - Optional coupon code
   * @returns {Object} Created order
   */
  create(userId, items, couponCode) {
    // Calculate pricing using centralized service
    const pricing = pricingService.calculateOrderTotal(items, couponCode);
    
    const order = {
      id: this.orders.length + 1,
      userId,
      items,
      total: Math.round(pricing.total * 100) / 100,
      couponCode,
      status: 'pending',
      created: new Date()
    };
    
    this.orders.push(order);
    return order;
  }

  /**
   * Find order by ID
   * @param {number} orderId - Order ID
   * @returns {Object|null} Order if found, null otherwise
   */
  findById(orderId) {
    return this.orders.find(o => o.id === orderId) || null;
  }

  /**
   * Get receipt data for an order
   * @param {number} orderId - Order ID
   * @returns {Object|null} Receipt data or null if order not found
   */
  getReceipt(orderId) {
    const order = this.findById(orderId);
    if (!order) return null;
    
    // Recalculate pricing for receipt
    const pricing = pricingService.calculateOrderTotal(order.items, order.couponCode);
    
    return {
      orderId: order.id,
      items: order.items.map(i => ({ name: i.name, price: i.price })),
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      coupon: order.couponCode || 'none'
    };
  }

  /**
   * Get all orders
   * @returns {Array} All orders
   */
  getAll() {
    return this.orders;
  }
}

// Export singleton instance
module.exports = new OrderService();
```

**Behavior Preservation:**
- ✅ Same order ID generation
- ✅ Same pricing calculation (uses existing pricingService)
- ✅ Same rounding behavior
- ✅ Same receipt format

### 3.1.4 Analytics Service

**File:** [`services/analytics.js`](services/analytics.js) (NEW)

```javascript
// services/analytics.js
// Business logic for analytics operations

const pricingService = require('./pricing');

class AnalyticsService {
  /**
   * Calculate revenue statistics from orders
   * @param {Array} orders - Array of order objects
   * @returns {Object} { totalRevenue, preTaxRevenue, orderCount }
   */
  calculateRevenue(orders) {
    let totalRevenue = 0;
    
    for (const order of orders) {
      totalRevenue += order.total;
    }
    
    // Calculate pre-tax revenue using centralized tax rate
    const preTaxRevenue = totalRevenue / (1 + pricingService.TAX_RATE);
    
    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      preTaxRevenue: Math.round(preTaxRevenue * 100) / 100,
      orderCount: orders.length
    };
  }
}

// Export singleton instance
module.exports = new AnalyticsService();
```

**Behavior Preservation:**
- ✅ Same calculation logic
- ✅ Uses centralized tax rate (from Step 1)
- ✅ Same rounding behavior
- ✅ Same response format

---

## 3.2 Create Route Modules

### 3.2.1 User Routes

**File:** [`routes/users.js`](routes/users.js) (NEW)

```javascript
// routes/users.js
// HTTP routes for user operations

const express = require('express');
const router = express.Router();
const userService = require('../services/user');
const validationService = require('../services/validation');

// POST /register
router.post('/register', (req, res) => {
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
    const user = userService.register({ email, password, name });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  const validation = validationService.validateRequired(['email', 'password'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: validation.missing 
    });
  }
  
  const user = userService.login(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true, user });
});

module.exports = router;
```

### 3.2.2 Product Routes

**File:** [`routes/products.js`](routes/products.js) (NEW)

```javascript
// routes/products.js
// HTTP routes for product operations

const express = require('express');
const router = express.Router();
const productService = require('../services/product');
const validationService = require('../services/validation');

// GET /products
router.get('/', (req, res) => {
  const products = productService.getAll();
  res.json(products);
});

// POST /products
router.post('/', (req, res) => {
  const { name, price, category } = req.body;
  
  // Validate required fields
  const requiredValidation = validationService.validateRequired(['name', 'price'], req.body);
  if (!requiredValidation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: requiredValidation.missing 
    });
  }
  
  // Validate price
  const priceValidation = validationService.validatePrice(price);
  if (!priceValidation.valid) {
    return res.status(400).json({ error: priceValidation.error });
  }
  
  const product = productService.create({ name, price, category });
  res.json({ success: true, product });
});

module.exports = router;
```

### 3.2.3 Order Routes

**File:** [`routes/orders.js`](routes/orders.js) (NEW)

```javascript
// routes/orders.js
// HTTP routes for order operations

const express = require('express');
const router = express.Router();
const orderService = require('../services/order');
const userService = require('../services/user');
const productService = require('../services/product');
const validationService = require('../services/validation');

// POST /orders
router.post('/', (req, res) => {
  const { userId, productIds, couponCode } = req.body;
  
  // Validate required fields
  const validation = validationService.validateRequired(['userId', 'productIds'], req.body);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      missing: validation.missing 
    });
  }
  
  // Validate productIds is an array
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ error: 'productIds must be an array' });
  }
  
  // Verify user exists
  const user = userService.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Get products (missing IDs are silently skipped)
  const orderItems = productService.findByIds(productIds);
  
  // Create order
  const order = orderService.create(userId, orderItems, couponCode);
  res.json({ success: true, order });
});

// GET /orders/:id/receipt
router.get('/:id/receipt', (req, res) => {
  const orderId = parseInt(req.params.id);
  const receipt = orderService.getReceipt(orderId);
  
  if (!receipt) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(receipt);
});

module.exports = router;
```

### 3.2.4 Analytics Routes

**File:** [`routes/analytics.js`](routes/analytics.js) (NEW)

```javascript
// routes/analytics.js
// HTTP routes for analytics operations

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics');
const orderService = require('../services/order');

// GET /analytics/revenue
router.get('/revenue', (req, res) => {
  const orders = orderService.getAll();
  const revenue = analyticsService.calculateRevenue(orders);
  res.json(revenue);
});

module.exports = router;
```

---

## 3.3 Update server.js

**File:** [`server.js`](server.js)

**Complete Rewrite (from 118 lines to ~20 lines):**

```javascript
// server.js
// Main application entry point - routing configuration only

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Import route modules
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/', userRoutes);              // /register, /login
app.use('/products', productRoutes);   // /products
app.use('/orders', orderRoutes);       // /orders, /orders/:id/receipt
app.use('/analytics', analyticsRoutes); // /analytics/revenue

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
```

**Key Changes:**
- ❌ Removed all in-memory data arrays (now in services)
- ❌ Removed all route handlers (now in route modules)
- ❌ Removed all business logic (now in services)
- ✅ Kept Express setup
- ✅ Added route mounting

**Behavior Preservation:**
- ✅ All endpoints at same URLs
- ✅ Same request/response formats
- ✅ Same validation behavior
- ✅ Same error messages
- ✅ Same status codes

---

## Edge Cases to Consider

1. **Route Order:** More specific routes must come before generic ones
2. **Middleware Order:** `express.json()` must come before routes
3. **Module Exports:** All services export singleton instances
4. **Circular Dependencies:** Avoid services importing each other (except pricing/validation)
5. **Error Handling:** Services throw errors, routes catch and return HTTP responses

---

## Migration Steps (Order Matters!)

1. ✅ Create all service files first
2. ✅ Create all route files second
3. ✅ Update server.js last
4. ✅ Test after each file creation
5. ✅ Verify all endpoints work

**DO NOT:**
- Delete old server.js until new structure is tested
- Change multiple files simultaneously
- Skip testing between changes

---

## Testing Strategy

### Unit Tests (Future Enhancement)
```javascript
// Example: tests/services/user.test.js
const userService = require('../services/user');

// Test register()
// Test login()
// Test findById()
```

### Integration Tests (Manual for Now)
```bash
# Test user registration
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}'

# Test login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Test product creation
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":19.99,"category":"gadgets"}'

# Test order creation
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"productIds":[1],"couponCode":"SAVE10"}'

# Test receipt
curl http://localhost:3000/orders/1/receipt

# Test analytics
curl http://localhost:3000/analytics/revenue
```

---

## Verification Checklist

- [ ] All service files created in [`services/`](services/)
- [ ] All route files created in [`routes/`](routes/)
- [ ] [`server.js`](server.js) simplified to ~20 lines
- [ ] Server starts without errors
- [ ] All endpoints accessible at same URLs
- [ ] POST /register works
- [ ] POST /login works
- [ ] GET /products works
- [ ] POST /products works
- [ ] POST /orders works
- [ ] GET /orders/:id/receipt works
- [ ] GET /analytics/revenue works
- [ ] All validation still works
- [ ] All pricing calculations correct
- [ ] Error messages unchanged

---

## Success Criteria

- ✅ Business logic separated from HTTP layer
- ✅ Each service has single responsibility
- ✅ Routes only handle HTTP concerns
- ✅ [`server.js`](server.js) is minimal and clean
- ✅ All tests pass
- ✅ No behavior changes
- ✅ Code is more maintainable and testable