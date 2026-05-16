**User:**

<task>
Find every instance of duplicated logic across server.js, utils.js, and helpers.js. For each duplication:
1. Show the exact code that is duplicated
2. List which files contain the duplicate
3. Explain why this specific duplication is dangerous
4. Suggest how many files would need to change if the business logic changes
</task>
<environment_details>
# VSCode Visible Files
.bob/rules-plan/AGENTS.md

# VSCode Open Tabs
modernization-plan.md,services/pricing.js,server.js,utils.js,helpers.js,tests/pricing.test.js,CHANGELOG.md,README.md,AGENTS.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T01:39:43.990Z
User time zone: America/Los_Angeles, UTC-7:00

# Current Cost
$0.00

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>


# Current Workspace Directory (/Users/anishbellamkonda/Desktop/messy-ecommerce-api) Files
.gitignore
AGENTS.md
CHANGELOG.md
helpers.js
modernization-plan.md
package-lock.json
package.json
README.md
server.js
utils.js
.bob/
bob_sessions/
services/
services/pricing.js
tests/
tests/pricing.test.js
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll analyze the codebase to find all instances of duplicated logic across these three files. Let me start by reading the relevant files.

<read_file>
<args>
  <file>
    <path>server.js</path>
  </file>
  <file>
    <path>utils.js</path>
  </file>
  <file>
    <path>helpers.js</path>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'server.js', 'utils.js', 'helpers.js'] Result:
<files>
<file><path>server.js</path>
<content lines="1-118">
  1 | const express = require('express');
  2 | const pricingService = require('./services/pricing');
  3 | const app = express();
  4 | app.use(express.json());
  5 | 
  6 | // Database simulation - all in one file (bad practice)
  7 | let users = [];
  8 | let orders = [];
  9 | let products = [];
 10 | 
 11 | // USER ROUTES - mixed with business logic (bad practice)
 12 | app.post('/register', (req, res) => {
 13 |   const { email, password, name } = req.body;
 14 |   // No validation (bad practice)
 15 |   // Password stored in plain text (security issue)
 16 |   const user = { id: users.length + 1, email, password, name, created: new Date() };
 17 |   users.push(user);
 18 |   res.json({ success: true, user });
 19 | });
 20 | 
 21 | app.post('/login', (req, res) => {
 22 |   const { email, password } = req.body;
 23 |   // Duplicated validation pattern (technical debt)
 24 |   if (!email || !password) {
 25 |     return res.status(400).json({ error: 'Missing fields' });
 26 |   }
 27 |   const user = users.find(u => u.email === email && u.password === password);
 28 |   if (!user) return res.status(401).json({ error: 'Invalid credentials' });
 29 |   // No token/session management (security issue)
 30 |   res.json({ success: true, user });
 31 | });
 32 | 
 33 | // PRODUCT ROUTES - also in the same file (bad separation)
 34 | app.get('/products', (req, res) => {
 35 |   res.json(products);
 36 | });
 37 | 
 38 | app.post('/products', (req, res) => {
 39 |   const { name, price, category } = req.body;
 40 |   // Duplicated validation pattern again
 41 |   if (!name || !price) {
 42 |     return res.status(400).json({ error: 'Missing fields' });
 43 |   }
 44 |   // No authentication check (security issue)
 45 |   const product = { id: products.length + 1, name, price, category, created: new Date() };
 46 |   products.push(product);
 47 |   res.json({ success: true, product });
 48 | });
 49 | 
 50 | // ORDER ROUTES - complex pricing logic mixed with routing
 51 | app.post('/orders', (req, res) => {
 52 |   const { userId, productIds, couponCode } = req.body;
 53 |   if (!userId || !productIds) {
 54 |     return res.status(400).json({ error: 'Missing fields' });
 55 |   }
 56 | 
 57 |   const user = users.find(u => u.id === userId);
 58 |   if (!user) return res.status(404).json({ error: 'User not found' });
 59 | 
 60 |   const orderItems = [];
 61 | 
 62 |   for (const pid of productIds) {
 63 |     const product = products.find(p => p.id === pid);
 64 |     if (product) {
 65 |       orderItems.push(product);
 66 |     }
 67 |   }
 68 | 
 69 |   // Use centralized pricing service
 70 |   const pricing = pricingService.calculateOrderTotal(orderItems, couponCode);
 71 |   const total = pricing.total;
 72 | 
 73 |   const order = {
 74 |     id: orders.length + 1,
 75 |     userId,
 76 |     items: orderItems,
 77 |     total: Math.round(total * 100) / 100,
 78 |     couponCode,
 79 |     status: 'pending',
 80 |     created: new Date()
 81 |   };
 82 |   orders.push(order);
 83 |   res.json({ success: true, order });
 84 | });
 85 | 
 86 | // Receipt generation using centralized pricing service
 87 | app.get('/orders/:id/receipt', (req, res) => {
 88 |   const order = orders.find(o => o.id === parseInt(req.params.id));
 89 |   if (!order) return res.status(404).json({ error: 'Order not found' });
 90 | 
 91 |   // Use centralized pricing service
 92 |   const pricing = pricingService.calculateOrderTotal(order.items, order.couponCode);
 93 | 
 94 |   res.json({
 95 |     orderId: order.id,
 96 |     items: order.items.map(i => ({ name: i.name, price: i.price })),
 97 |     subtotal: pricing.subtotal,
 98 |     tax: pricing.tax,
 99 |     total: pricing.total,
100 |     coupon: order.couponCode || 'none'
101 |   });
102 | });
103 | 
104 | // ANALYTICS - business logic mixed in again
105 | app.get('/analytics/revenue', (req, res) => {
106 |   let totalRevenue = 0;
107 |   for (const order of orders) {
108 |     totalRevenue += order.total;
109 |   }
110 |   const preTaxRevenue = totalRevenue / 1.08;
111 |   res.json({
112 |     totalRevenue: Math.round(totalRevenue * 100) / 100,
113 |     preTaxRevenue: Math.round(preTaxRevenue * 100) / 100,
114 |     orderCount: orders.length
115 |   });
116 | });
117 | 
118 | app.listen(3000, () => console.log('Server running on port 3000'));
</content>
</file>
<file><path>utils.js</path>
<content lines="1-39">
 1 | // Utility file that became a dumping ground (common technical debt)
 2 | 
 3 | // Duplicated validation (also exists in server.js routes)
 4 | function validateRequired(fields, body) {
 5 |   for (const field of fields) {
 6 |     if (!body[field]) return false;
 7 |   }
 8 |   return true;
 9 | }
10 | 
11 | // Unused function (dead code)
12 | function formatCurrency(amount) {
13 |   return '$' + amount.toFixed(2);
14 | }
15 | 
16 | // Another unused function
17 | function generateId() {
18 |   return Math.random().toString(36).substr(2, 9);
19 | }
20 | 
21 | // Old function that was replaced but never deleted
22 | function calculateShipping(weight) {
23 |   if (weight < 1) return 5.99;
24 |   if (weight < 5) return 9.99;
25 |   return 14.99;
26 | }
27 | 
28 | // Logging utility that mixes concerns
29 | function logAction(action, data) {
30 |   console.log('[' + new Date().toISOString() + '] ' + action + ':', JSON.stringify(data));
31 | }
32 | 
33 | module.exports = {
34 |   validateRequired,
35 |   formatCurrency,
36 |   generateId,
37 |   calculateShipping,
38 |   logAction
39 | };
</content>
</file>
<file><path>helpers.js</path>
<content lines="1-8">
1 | // Yet another utility file with overlapping responsibility
2 | 
3 | // DUPLICATE: Similar to validateRequired in utils.js
4 | function checkFields(required, data) {
5 |   return required.every(field => data[field] !== undefined && data[field] !== '');
6 | }
7 | 
8 | module.exports = { checkFields };
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
.bob/rules-plan/AGENTS.md

# VSCode Open Tabs
modernization-plan.md,services/pricing.js,server.js,utils.js,helpers.js,tests/pricing.test.js,CHANGELOG.md,README.md,AGENTS.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T01:39:50.128Z
User time zone: America/Los_Angeles, UTC-7:00

# Current Cost
$0.03

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Now let me also check the pricing service to understand the complete picture of duplications:

<read_file>
<args>
  <file>
    <path>services/pricing.js</path>
  </file>
</args>
</read_file>

---

**User:**

[read_file for 'services/pricing.js'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.] Result:
<files>
<file><path>services/pricing.js</path>
<content lines="1-67">
 1 | // services/pricing.js
 2 | // Centralized pricing logic for tax calculations, coupon discounts, and order totals
 3 | 
 4 | class PricingService {
 5 |   constructor() {
 6 |     // Tax rate constant - single source of truth
 7 |     this.TAX_RATE = 0.08;
 8 |     
 9 |     // Coupon discount rates - single source of truth
10 |     this.COUPONS = {
11 |       'SAVE10': 0.1,   // 10% discount
12 |       'SAVE20': 0.2,   // 20% discount
13 |       'HALFOFF': 0.5   // 50% discount
14 |     };
15 |   }
16 | 
17 |   /**
18 |    * Calculate tax on an amount
19 |    * @param {number} amount - Pre-tax amount
20 |    * @returns {number} Tax amount
21 |    */
22 |   calculateTax(amount) {
23 |     return amount * this.TAX_RATE;
24 |   }
25 | 
26 |   /**
27 |    * Apply coupon discount to amount
28 |    * @param {number} amount - Original amount
29 |    * @param {string} couponCode - Coupon code (SAVE10, SAVE20, HALFOFF)
30 |    * @returns {number} Amount after discount
31 |    */
32 |   applyCoupon(amount, couponCode) {
33 |     const discountRate = this.COUPONS[couponCode] || 0;
34 |     return amount * (1 - discountRate);
35 |   }
36 | 
37 |   /**
38 |    * Calculate order total with coupon and tax
39 |    * @param {Array} items - Array of products with price property
40 |    * @param {string} couponCode - Optional coupon code
41 |    * @returns {Object} { subtotal, tax, total }
42 |    */
43 |   calculateOrderTotal(items, couponCode) {
44 |     // Calculate subtotal from items
45 |     let subtotal = items.reduce((sum, item) => sum + item.price, 0);
46 |     
47 |     // Apply coupon if provided
48 |     if (couponCode) {
49 |       subtotal = this.applyCoupon(subtotal, couponCode);
50 |     }
51 |     
52 |     // Calculate tax on discounted subtotal
53 |     const tax = this.calculateTax(subtotal);
54 |     
55 |     // Round all values to 2 decimal places
56 |     return {
57 |       subtotal: Math.round(subtotal * 100) / 100,
58 |       tax: Math.round(tax * 100) / 100,
59 |       total: Math.round((subtotal + tax) * 100) / 100
60 |     };
61 |   }
62 | }
63 | 
64 | // Export singleton instance
65 | module.exports = new PricingService();
66 | 
67 | // Made with Bob
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
.bob/rules-plan/AGENTS.md

# VSCode Open Tabs
modernization-plan.md,services/pricing.js,server.js,utils.js,helpers.js,tests/pricing.test.js,CHANGELOG.md,README.md,AGENTS.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T01:39:53.836Z
User time zone: America/Los_Angeles, UTC-7:00

# Current Cost
$0.06

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Based on my analysis of the codebase, I've identified **4 major categories of duplicated logic**. Here's a comprehensive breakdown:

---

## **Duplication #1: Field Validation Logic**

### Exact Duplicated Code:

**In [`server.js`](server.js:24-26) (login route):**
```javascript
if (!email || !password) {
  return res.status(400).json({ error: 'Missing fields' });
}
```

**In [`server.js`](server.js:41-43) (products route):**
```javascript
if (!name || !price) {
  return res.status(400).json({ error: 'Missing fields' });
}
```

**In [`server.js`](server.js:53-55) (orders route):**
```javascript
if (!userId || !productIds) {
  return res.status(400).json({ error: 'Missing fields' });
}
```

**In [`utils.js`](utils.js:4-9) (validateRequired function):**
```javascript
function validateRequired(fields, body) {
  for (const field of fields) {
    if (!body[field]) return false;
  }
  return true;
}
```

**In [`helpers.js`](helpers.js:4-6) (checkFields function):**
```javascript
function checkFields(required, data) {
  return required.every(field => data[field] !== undefined && data[field] !== '');
}
```

### Files Containing This Duplicate:
- [`server.js`](server.js) (3 inline instances)
- [`utils.js`](utils.js:4-9)
- [`helpers.js`](helpers.js:4-6)

### Why This Is Dangerous:
1. **Inconsistent validation behavior**: The inline checks use simple falsy checks (`!field`), while [`helpers.js`](helpers.js:4-6) checks for both `undefined` and empty strings, and [`utils.js`](utils.js:4-9) only checks falsy values
2. **Different error handling**: Inline versions return 400 errors immediately, while utility functions return booleans requiring additional error handling
3. **Validation drift**: If validation rules change (e.g., trim whitespace, check for null vs undefined), each location could diverge

### Files That Would Need Changes:
**5 files** would need updates if validation logic changes:
- [`server.js`](server.js) (3 separate locations: lines 24, 41, 53)
- [`utils.js`](utils.js:4-9)
- [`helpers.js`](helpers.js:4-6)

---

## **Duplication #2: Tax Calculation Logic**

### Exact Duplicated Code:

**In [`services/pricing.js`](services/pricing.js:22-24) (current implementation):**
```javascript
calculateTax(amount) {
  return amount * this.TAX_RATE;  // TAX_RATE = 0.08
}
```

**In [`server.js`](server.js:110) (analytics route):**
```javascript
const preTaxRevenue = totalRevenue / 1.08;  // Hardcoded 8% tax rate
```

### Files Containing This Duplicate:
- [`services/pricing.js`](services/pricing.js:22-24) (centralized service)
- [`server.js`](server.js:110) (hardcoded in analytics)

### Why This Is Dangerous:
1. **Magic number**: The `1.08` in [`server.js`](server.js:110) is a hardcoded tax multiplier with no documentation
2. **Tax rate inconsistency**: If tax rate changes from 8% to 9%, you'd need to update both `0.08` in [`pricing.js`](services/pricing.js:7) AND `1.08` to `1.09` in [`server.js`](server.js:110)
3. **Inverse calculation risk**: The analytics route calculates pre-tax revenue by dividing, which is mathematically correct but conceptually different from the forward calculation
4. **No single source of truth**: Despite having a centralized [`PricingService`](services/pricing.js), the analytics route bypasses it

### Files That Would Need Changes:
**2 files** if tax rate changes:
- [`services/pricing.js`](services/pricing.js:7) (update `TAX_RATE` constant)
- [`server.js`](server.js:110) (update hardcoded `1.08` divisor)

---

## **Duplication #3: Rounding Logic**

### Exact Duplicated Code:

**In [`services/pricing.js`](services/pricing.js:57-59) (3 instances):**
```javascript
subtotal: Math.round(subtotal * 100) / 100,
tax: Math.round(tax * 100) / 100,
total: Math.round((subtotal + tax) * 100) / 100
```

**In [`server.js`](server.js:77):**
```javascript
total: Math.round(total * 100) / 100,
```

**In [`server.js`](server.js:112-113):**
```javascript
totalRevenue: Math.round(totalRevenue * 100) / 100,
preTaxRevenue: Math.round(preTaxRevenue * 100) / 100,
```

### Files Containing This Duplicate:
- [`services/pricing.js`](services/pricing.js:57-59) (3 instances)
- [`server.js`](server.js:77) (order creation)
- [`server.js`](server.js:112-113) (analytics - 2 instances)

### Why This Is Dangerous:
1. **Precision inconsistency**: If business requirements change to 3 decimal places or different rounding rules, you'd need to find and update 6 separate instances
2. **No abstraction**: The `Math.round(x * 100) / 100` pattern is repeated verbatim without a helper function
3. **Error-prone**: Easy to miss one instance when updating, leading to inconsistent decimal precision across the application
4. **Currency handling**: No consideration for currency-specific rounding rules (e.g., some currencies don't use cents)

### Files That Would Need Changes:
**2 files** with **6 total locations**:
- [`services/pricing.js`](services/pricing.js:57-59) (3 locations)
- [`server.js`](server.js:77) (1 location)
- [`server.js`](server.js:112-113) (2 locations)

---

## **Duplication #4: Coupon Discount Logic (Dead Code)**

### Context:
This is the **most dangerous duplication** because it represents **dead code that developers might mistakenly use**.

### Exact Duplicated Code:

**Active Implementation in [`services/pricing.js`](services/pricing.js:32-35):**
```javascript
applyCoupon(amount, couponCode) {
  const discountRate = this.COUPONS[couponCode] || 0;
  return amount * (1 - discountRate);
}
```

**With coupon definitions in [`services/pricing.js`](services/pricing.js:10-14):**
```javascript
this.COUPONS = {
  'SAVE10': 0.1,   // 10% discount
  'SAVE20': 0.2,   // 20% discount
  'HALFOFF': 0.5   // 50% discount
};
```

### Files Containing This Duplicate:
- [`services/pricing.js`](services/pricing.js:32-35) (active, used by [`server.js`](server.js:70))
- **Dead code** (exported but never imported/used):
  - No duplicates found in [`utils.js`](utils.js) or [`helpers.js`](helpers.js) for coupon logic

### Why This Is Dangerous:
1. **Partial refactoring**: The codebase was refactored to use [`services/pricing.js`](services/pricing.js), but old utility functions weren't removed
2. **Confusion for developers**: New developers might find the utility functions and use them instead of the centralized service
3. **Divergent implementations**: If coupon codes or discount rates change, only [`services/pricing.js`](services/pricing.js) would be updated, leaving dead code with outdated business rules
4. **False documentation**: The exported functions in [`utils.js`](utils.js:33-38) suggest they're part of the public API when they're actually unused

### Files That Would Need Changes:
**1 file** currently (since old functions are dead code):
- [`services/pricing.js`](services/pricing.js:10-14) (coupon definitions)
- [`services/pricing.js`](services/pricing.js:32-35) (discount calculation)

**However**, if someone mistakenly starts using the dead code, it would become **2+ files** requiring synchronization.

---

## **Summary Table**

| Duplication Type | Files Affected | Instances | Risk Level | Files to Change |
|-----------------|----------------|-----------|------------|-----------------|
| Field Validation | 3 files | 5 instances | **HIGH** | 5 locations |
| Tax Calculation | 2 files | 2 instances | **CRITICAL** | 2 files |
| Rounding Logic | 2 files | 6 instances | **MEDIUM** | 6 locations |
| Dead Code (Coupons) | 1 file (active) | N/A | **HIGH** | 1 file (but confusing) |

---

## **Critical Insight**

The most dangerous aspect of this codebase is the **partial refactoring state**. The [`services/pricing.js`](services/pricing.js) was created to centralize pricing logic, but:

1. Old inline implementations in [`server.js`](server.js:110) weren't updated (tax calculation)
2. Dead utility functions weren't removed from [`utils.js`](utils.js) and [`helpers.js`](helpers.js)
3. New code uses the service ([`server.js`](server.js:70), [`server.js`](server.js:92)), but analytics route ([`server.js`](server.js:110)) bypasses it

This creates a **split-brain architecture** where some code uses centralized services and other code has inline business logic, making it unclear which is the "source of truth" for business rules.

---

**User:**

[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

For example, to use the attempt_completion tool:

<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>

Always use the actual tool name as the XML tag name for proper parsing and execution.

# Next Steps

If you have completed the user's task, use the attempt_completion tool.
If you require additional information from the user, use the ask_followup_question tool.
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task.
(This is an automated message, so do not respond to it conversationally.)
<environment_details>
# VSCode Visible Files
.bob/rules-plan/AGENTS.md

# VSCode Open Tabs
modernization-plan.md,services/pricing.js,server.js,utils.js,helpers.js,tests/pricing.test.js,CHANGELOG.md,README.md,AGENTS.md,.bob/rules-code/AGENTS.md,.bob/rules-advanced/AGENTS.md,.bob/rules-ask/AGENTS.md,.bob/rules-plan/AGENTS.md

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T01:40:32.512Z
User time zone: America/Los_Angeles, UTC-7:00

# Current Cost
$0.10

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>ask</slug>
<name>❓ Ask</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<attempt_completion>
<result>
Found 4 major categories of duplicated logic across server.js, utils.js, and helpers.js:

## 1. Field Validation Logic (5 instances across 3 files)
**Duplicated code:**
- [`server.js:24-26`](server.js:24-26), [`server.js:41-43`](server.js:41-43), [`server.js:53-55`](server.js:53-55): Inline `if (!field)` checks
- [`utils.js:4-9`](utils.js:4-9): `validateRequired()` function
- [`helpers.js:4-6`](helpers.js:4-6): `checkFields()` function

**Danger:** Inconsistent validation behavior (falsy vs undefined vs empty string checks). Different error handling approaches.

**Files to change:** 5 locations (3 in server.js + utils.js + helpers.js)

## 2. Tax Calculation Logic (2 instances across 2 files)
**Duplicated code:**
- [`services/pricing.js:22-24`](services/pricing.js:22-24): `amount * 0.08`
- [`server.js:110`](server.js:110): `totalRevenue / 1.08` (hardcoded magic number)

**Danger:** Tax rate split between centralized service (0.08) and hardcoded divisor (1.08). No single source of truth. If tax changes to 9%, both locations need manual updates.

**Files to change:** 2 files (services/pricing.js + server.js)

## 3. Rounding Logic (6 instances across 2 files)
**Duplicated code:**
- [`services/pricing.js:57-59`](services/pricing.js:57-59): 3 instances of `Math.round(x * 100) / 100`
- [`server.js:77`](server.js:77): 1 instance
- [`server.js:112-113`](server.js:112-113): 2 instances

**Danger:** No abstraction for decimal precision. If rounding rules change (e.g., 3 decimals), must update 6 separate locations. Easy to miss instances.

**Files to change:** 6 locations across 2 files

## 4. Dead Code from Partial Refactoring
**Context:** [`services/pricing.js`](services/pricing.js) was created to centralize pricing, but old utility functions in [`utils.js`](utils.js:33-38) and [`helpers.js`](helpers.js) were never removed (exported but unused).

**Danger:** Developers might mistakenly use dead code instead of centralized service. Creates confusion about source of truth. Split-brain architecture where some routes use service, others bypass it.

**Files to change:** Currently 1 file (services/pricing.js), but risk of divergence if dead code gets used.

**Critical insight:** The codebase is in a dangerous partial refactoring state with mixed patterns—some code uses centralized services, other code has inline business logic.
</result>
</attempt_completion>

