// Utility file that became a dumping ground (common technical debt)

// Duplicated tax calculation (also exists in server.js)
function calculateTax(amount) {
  return amount * 0.08;
}

// Duplicated validation (also exists in server.js routes)
function validateRequired(fields, body) {
  for (const field of fields) {
    if (!body[field]) return false;
  }
  return true;
}

// Duplicated coupon logic (also exists in server.js)
function applyCoupon(total, code) {
  if (code === 'SAVE10') return total * 0.9;
  if (code === 'SAVE20') return total * 0.8;
  if (code === 'HALFOFF') return total * 0.5;
  return total;
}

// Unused function (dead code)
function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

// Another unused function
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Old function that was replaced but never deleted
function calculateShipping(weight) {
  if (weight < 1) return 5.99;
  if (weight < 5) return 9.99;
  return 14.99;
}

// Logging utility that mixes concerns
function logAction(action, data) {
  console.log('[' + new Date().toISOString() + '] ' + action + ':', JSON.stringify(data));
}

module.exports = {
  calculateTax,
  validateRequired,
  applyCoupon,
  formatCurrency,
  generateId,
  calculateShipping,
  logAction
};
