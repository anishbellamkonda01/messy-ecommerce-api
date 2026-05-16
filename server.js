const express = require('express');
const pricingService = require('./services/pricing');
const app = express();
app.use(express.json());

// Database simulation - all in one file (bad practice)
let users = [];
let orders = [];
let products = [];

// USER ROUTES - mixed with business logic (bad practice)
app.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  // No validation (bad practice)
  // Password stored in plain text (security issue)
  const user = { id: users.length + 1, email, password, name, created: new Date() };
  users.push(user);
  res.json({ success: true, user });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Duplicated validation pattern (technical debt)
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // No token/session management (security issue)
  res.json({ success: true, user });
});

// PRODUCT ROUTES - also in the same file (bad separation)
app.get('/products', (req, res) => {
  res.json(products);
});

app.post('/products', (req, res) => {
  const { name, price, category } = req.body;
  // Duplicated validation pattern again
  if (!name || !price) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // No authentication check (security issue)
  const product = { id: products.length + 1, name, price, category, created: new Date() };
  products.push(product);
  res.json({ success: true, product });
});

// ORDER ROUTES - complex pricing logic mixed with routing
app.post('/orders', (req, res) => {
  const { userId, productIds, couponCode } = req.body;
  if (!userId || !productIds) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const orderItems = [];

  for (const pid of productIds) {
    const product = products.find(p => p.id === pid);
    if (product) {
      orderItems.push(product);
    }
  }

  // Use centralized pricing service
  const pricing = pricingService.calculateOrderTotal(orderItems, couponCode);
  const total = pricing.total;

  const order = {
    id: orders.length + 1,
    userId,
    items: orderItems,
    total: Math.round(total * 100) / 100,
    couponCode,
    status: 'pending',
    created: new Date()
  };
  orders.push(order);
  res.json({ success: true, order });
});

// Receipt generation using centralized pricing service
app.get('/orders/:id/receipt', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Use centralized pricing service
  const pricing = pricingService.calculateOrderTotal(order.items, order.couponCode);

  res.json({
    orderId: order.id,
    items: order.items.map(i => ({ name: i.name, price: i.price })),
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    total: pricing.total,
    coupon: order.couponCode || 'none'
  });
});

// ANALYTICS - business logic mixed in again
app.get('/analytics/revenue', (req, res) => {
  let totalRevenue = 0;
  for (const order of orders) {
    totalRevenue += order.total;
  }
  const preTaxRevenue = totalRevenue / 1.08;
  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    preTaxRevenue: Math.round(preTaxRevenue * 100) / 100,
    orderCount: orders.length
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
