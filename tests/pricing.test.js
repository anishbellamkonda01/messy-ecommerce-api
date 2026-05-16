// tests/pricing.test.js
// Test suite for services/pricing.js
// Uses simple console.log assertions (no test framework)

const pricingService = require('../services/pricing.js');

// Test helper function
function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.log(`✗ FAIL: ${testName}`);
  }
}

function assertApprox(actual, expected, testName, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  if (diff < tolerance) {
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.log(`✗ FAIL: ${testName} (expected ${expected}, got ${actual})`);
  }
}

console.log('\n=== Testing applyCoupon ===\n');

// Test 1: applyCoupon with SAVE10 (10% discount)
const save10Result = pricingService.applyCoupon(100, 'SAVE10');
assertApprox(save10Result, 90, 'applyCoupon with SAVE10 should apply 10% discount');

// Test 2: applyCoupon with SAVE20 (20% discount)
const save20Result = pricingService.applyCoupon(100, 'SAVE20');
assertApprox(save20Result, 80, 'applyCoupon with SAVE20 should apply 20% discount');

// Test 3: applyCoupon with HALFOFF (50% discount)
const halfoffResult = pricingService.applyCoupon(100, 'HALFOFF');
assertApprox(halfoffResult, 50, 'applyCoupon with HALFOFF should apply 50% discount');

// Test 4: applyCoupon with invalid coupon code
const invalidResult = pricingService.applyCoupon(100, 'INVALID');
assertApprox(invalidResult, 100, 'applyCoupon with invalid code should return original amount');

// Test 5: applyCoupon with no coupon code (undefined)
const noCouponResult = pricingService.applyCoupon(100);
assertApprox(noCouponResult, 100, 'applyCoupon with no code should return original amount');

// Test 6: applyCoupon with null coupon code
const nullCouponResult = pricingService.applyCoupon(100, null);
assertApprox(nullCouponResult, 100, 'applyCoupon with null code should return original amount');

console.log('\n=== Testing calculateTax ===\n');

// Test 7: calculateTax with $100
const tax100 = pricingService.calculateTax(100);
assertApprox(tax100, 8, 'calculateTax on $100 should return $8 (8% tax)');

// Test 8: calculateTax with $50
const tax50 = pricingService.calculateTax(50);
assertApprox(tax50, 4, 'calculateTax on $50 should return $4 (8% tax)');

// Test 9: calculateTax with $0
const tax0 = pricingService.calculateTax(0);
assertApprox(tax0, 0, 'calculateTax on $0 should return $0');

// Test 10: calculateTax with decimal amount
const taxDecimal = pricingService.calculateTax(25.50);
assertApprox(taxDecimal, 2.04, 'calculateTax on $25.50 should return $2.04');

console.log('\n=== Testing calculateOrderTotal ===\n');

// Test 11: calculateOrderTotal with multiple items and SAVE10 coupon
const items1 = [
  { name: 'Item 1', price: 50 },
  { name: 'Item 2', price: 30 },
  { name: 'Item 3', price: 20 }
];
const order1 = pricingService.calculateOrderTotal(items1, 'SAVE10');
assertApprox(order1.subtotal, 90, 'Order with $100 items and SAVE10 should have $90 subtotal');
assertApprox(order1.tax, 7.2, 'Order with $90 subtotal should have $7.20 tax');
assertApprox(order1.total, 97.2, 'Order total should be $97.20');

// Test 12: calculateOrderTotal with multiple items and SAVE20 coupon
const order2 = pricingService.calculateOrderTotal(items1, 'SAVE20');
assertApprox(order2.subtotal, 80, 'Order with $100 items and SAVE20 should have $80 subtotal');
assertApprox(order2.tax, 6.4, 'Order with $80 subtotal should have $6.40 tax');
assertApprox(order2.total, 86.4, 'Order total should be $86.40');

// Test 13: calculateOrderTotal with multiple items and HALFOFF coupon
const order3 = pricingService.calculateOrderTotal(items1, 'HALFOFF');
assertApprox(order3.subtotal, 50, 'Order with $100 items and HALFOFF should have $50 subtotal');
assertApprox(order3.tax, 4, 'Order with $50 subtotal should have $4.00 tax');
assertApprox(order3.total, 54, 'Order total should be $54.00');

// Test 14: calculateOrderTotal with multiple items and no coupon
const order4 = pricingService.calculateOrderTotal(items1);
assertApprox(order4.subtotal, 100, 'Order with $100 items and no coupon should have $100 subtotal');
assertApprox(order4.tax, 8, 'Order with $100 subtotal should have $8.00 tax');
assertApprox(order4.total, 108, 'Order total should be $108.00');

// Test 15: calculateOrderTotal with multiple items and invalid coupon
const order5 = pricingService.calculateOrderTotal(items1, 'INVALID');
assertApprox(order5.subtotal, 100, 'Order with invalid coupon should have full $100 subtotal');
assertApprox(order5.tax, 8, 'Order with $100 subtotal should have $8.00 tax');
assertApprox(order5.total, 108, 'Order total should be $108.00');

// Test 16: calculateOrderTotal with empty order
const emptyOrder = pricingService.calculateOrderTotal([]);
assertApprox(emptyOrder.subtotal, 0, 'Empty order should have $0 subtotal');
assertApprox(emptyOrder.tax, 0, 'Empty order should have $0 tax');
assertApprox(emptyOrder.total, 0, 'Empty order should have $0 total');

// Test 17: calculateOrderTotal with empty order and coupon
const emptyOrderWithCoupon = pricingService.calculateOrderTotal([], 'SAVE10');
assertApprox(emptyOrderWithCoupon.subtotal, 0, 'Empty order with coupon should have $0 subtotal');
assertApprox(emptyOrderWithCoupon.tax, 0, 'Empty order with coupon should have $0 tax');
assertApprox(emptyOrderWithCoupon.total, 0, 'Empty order with coupon should have $0 total');

// Test 18: calculateOrderTotal with single item
const singleItem = [{ name: 'Widget', price: 25.99 }];
const order6 = pricingService.calculateOrderTotal(singleItem);
assertApprox(order6.subtotal, 25.99, 'Single item order should have correct subtotal');
assertApprox(order6.tax, 2.08, 'Single item order should have correct tax (rounded)');
assertApprox(order6.total, 28.07, 'Single item order should have correct total');

console.log('\n=== Test Summary ===\n');
console.log('All tests completed. Review results above.');
console.log('Run with: node tests/pricing.test.js\n');

// Made with Bob
