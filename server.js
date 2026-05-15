const express = require('express');
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

  let total = 0;
  const orderItems = [];

  for (const pid of productIds) {
    const product = products.find(p => p.id === pid);
    if (product) {
      total += product.price;
      orderItems.push(product);
    }
  }

  // Pricing logic scattered here (should be its own module)
  if (couponCode === 'SAVE10') {
    total = total * 0.9;
  } else if (couponCode === 'SAVE20') {
    total = total * 0.8;
  } else if (couponCode === 'HALFOFF') {
    total = total * 0.5;
  }

  // Tax calculation duplicated (exists in utils too)
  const tax = total * 0.08;
  total = total + tax;

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

// DUPLICATE pricing logic in a utility
app.get('/orders/:id/receipt', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });

  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price;
  }

  if (order.couponCode === 'SAVE10') {
    subtotal = subtotal * 0.9;
  } else if (order.couponCode === 'SAVE20') {
    subtotal = subtotal * 0.8;
  } else if (order.couponCode === 'HALFOFF') {
    subtotal = subtotal * 0.5;
  }

  const tax = subtotal * 0.08;
  const finalTotal = subtotal + tax;

  res.json({
    orderId: order.id,
    items: order.items.map(i => ({ name: i.name, price: i.price })),
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(finalTotal * 100) / 100,
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
