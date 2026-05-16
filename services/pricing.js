// services/pricing.js
// Centralized pricing logic for tax calculations, coupon discounts, and order totals

class PricingService {
  constructor() {
    // Tax rate constant - single source of truth
    this.TAX_RATE = 0.08;
    
    // Coupon discount rates - single source of truth
    this.COUPONS = {
      'SAVE10': 0.1,   // 10% discount
      'SAVE20': 0.2,   // 20% discount
      'HALFOFF': 0.5   // 50% discount
    };
  }

  /**
   * Calculate tax on an amount
   * @param {number} amount - Pre-tax amount
   * @returns {number} Tax amount
   */
  calculateTax(amount) {
    return amount * this.TAX_RATE;
  }

  /**
   * Apply coupon discount to amount
   * @param {number} amount - Original amount
   * @param {string} couponCode - Coupon code (SAVE10, SAVE20, HALFOFF)
   * @returns {number} Amount after discount
   */
  applyCoupon(amount, couponCode) {
    const discountRate = this.COUPONS[couponCode] || 0;
    return amount * (1 - discountRate);
  }

  /**
   * Calculate order total with coupon and tax
   * @param {Array} items - Array of products with price property
   * @param {string} couponCode - Optional coupon code
   * @returns {Object} { subtotal, tax, total }
   */
  calculateOrderTotal(items, couponCode) {
    // Calculate subtotal from items
    let subtotal = items.reduce((sum, item) => sum + item.price, 0);
    
    // Apply coupon if provided
    if (couponCode) {
      subtotal = this.applyCoupon(subtotal, couponCode);
    }
    
    // Calculate tax on discounted subtotal
    const tax = this.calculateTax(subtotal);
    
    // Round all values to 2 decimal places
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((subtotal + tax) * 100) / 100
    };
  }
}

// Export singleton instance
module.exports = new PricingService();

// Made with Bob
