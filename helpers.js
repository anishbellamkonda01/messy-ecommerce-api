// Yet another utility file with overlapping responsibility

// DUPLICATE: This also exists in utils.js
function calcTax(price) {
  return price * 0.08;
}

// DUPLICATE: Similar to validateRequired in utils.js
function checkFields(required, data) {
  return required.every(field => data[field] !== undefined && data[field] !== '');
}

// DUPLICATE: Coupon logic exists in 3 places now
function getDiscount(code) {
  const discounts = {
    'SAVE10': 0.1,
    'SAVE20': 0.2,
    'HALFOFF': 0.5
  };
  return discounts[code] || 0;
}

// Business logic that should be in a service layer
function calculateOrderTotal(items, couponCode) {
  let subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discount = getDiscount(couponCode);
  subtotal = subtotal * (1 - discount);
  const tax = calcTax(subtotal);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + tax) * 100) / 100
  };
}

module.exports = { calcTax, checkFields, getDiscount, calculateOrderTotal };
