# 🌾 Agro Shop CRM Database Documentation

Version: 1.0
Status: Final Design (V1)

---

# Project Overview

This CRM is designed for a fertilizer, pesticide and agricultural products shop.

The system will manage:

- Product Inventory
- Purchase
- Sales
- Customer Due
- Supplier Due
- Stock Management
- Expense
- Cash Book
- Reports
- Employee Permission
- Backup
- Activity Log

---

# Database Design Rules

## Rule 1

One Product can have multiple Purchase Batches.

Example:

Urea

Batch A
Buy Price = 1200

Batch B
Buy Price = 1260

Batch C
Buy Price = 1180

---

## Rule 2

Stock will NEVER be stored directly in Product.

Current Stock =

Sum(ProductBatch.quantityRemaining)

---

## Rule 3

Every Purchase creates a new Product Batch.

---

## Rule 4

Every Sale reduces quantity from Product Batch.

---

## Rule 5

Profit is calculated from

Selling Price - Buying Price

for every Sale Item.

---

## Rule 6

Customer Due

Customer Due =

Total Purchase

-

Total Payment

---

## Rule 7

Supplier Due

Supplier Due =

Total Purchase Cost

-

Supplier Payment

---

## Rule 8

Every important action will be stored in Activity Log.

---

## Rule 9

Every financial transaction updates Cash Book.

---

# Database Modules

1. Master

- Category
- Product
- Supplier
- User
- Role
- Permission
- Settings

---

2. Inventory

- ProductBatch
- Purchase
- PurchaseItem
- PurchaseReturn
- Damage
- StockAdjustment
- StockMovement

---

3. Sales

- Customer
- Sale
- SaleItem
- SaleReturn
- CustomerPayment

---

4. Finance

- SupplierPayment
- ExpenseCategory
- Expense
- CashBook

---

5. Reports

- Sales Report
- Purchase Report
- Profit Report
- Expense Report
- Due Report
- Stock Report

---

6. Utility

- Backup
- Search
- Excel Import
- Activity Log

---

# Database Tables

---

# 1. Category

Purpose:

Stores product categories.

Fields:

- id
- name
- description
- isActive
- createdAt
- updatedAt

---

# 2. Product

Purpose:

Stores all products.

Fields:

- id
- categoryId
- name
- brand
- unit
- minimumStock
- isActive
- createdAt
- updatedAt

---

# 3. Supplier

Purpose:

Stores supplier information.

Fields:

- id
- name
- company
- phone
- email
- address
- openingDue
- isActive
- createdAt
- updatedAt

---

# 4. ProductBatch

Purpose:

Each purchase creates one batch.

Fields:

- id
- productId
- supplierId
- purchasePrice
- sellingPrice
- quantityPurchased
- quantityRemaining
- manufactureDate
- expiryDate
- purchaseDate
- createdAt
- updatedAt

---

# 5. Purchase

Purpose:

Stores purchase invoices.

Fields:

- id
- purchaseNo
- supplierId
- purchaseDate
- totalAmount
- paidAmount
- dueAmount
- note
- createdAt
- updatedAt

---

# 6. PurchaseItem

Purpose:

Products included in a purchase.

Fields:

- id
- purchaseId
- batchId
- quantity
- buyPrice
- totalPrice

---

# 7. PurchaseReturn

Purpose:

Supplier return records.

Fields:

- id
- purchaseItemId
- quantity
- amount
- reason
- returnDate

---

# 8. Customer

Purpose:

Stores customer information.

Fields:

- id
- name
- phone
- address
- openingDue
- isActive
- createdAt
- updatedAt

---

# 9. Sale

Purpose:

Stores sales invoices.

Fields:

- id
- invoiceNo
- customerId
- saleDate
- totalAmount
- discount
- paidAmount
- dueAmount
- note
- createdAt
- updatedAt

---

# 10. SaleItem

Purpose:

Products sold in one invoice.

Fields:

- id
- saleId
- batchId
- quantity
- buyPrice
- sellPrice
- totalPrice
- profit
---

# 11. CustomerPayment

Purpose:

Stores customer payment history.

Fields:

- id
- customerId
- saleId
- amount
- paymentDate
- paymentMethod
- note
- createdAt

Business Notes:

- One payment may be full or partial.
- A payment reduces customer's due.

---

# 12. SupplierPayment

Purpose:

Stores supplier payment history.

Fields:

- id
- supplierId
- purchaseId
- amount
- paymentDate
- paymentMethod
- note
- createdAt

Business Notes:

- Payment reduces supplier due.

---

# 13. ExpenseCategory

Purpose:

Expense categories.

Examples:

- Electricity
- Salary
- Transport
- Internet
- Others

Fields:

- id
- name
- description

---

# 14. Expense

Purpose:

Daily shop expenses.

Fields:

- id
- categoryId
- amount
- expenseDate
- paymentMethod
- note
- createdAt

---

# 15. CashBook

Purpose:

Stores all cash transactions.

Fields:

- id
- type
- referenceType
- referenceId
- amount
- transactionDate
- note
- createdAt

Business Notes:

Cash In

- Customer Payment

- Cash Sale

Cash Out

- Purchase Payment

- Expense

---

# 16. Damage

Purpose:

Stores damaged products.

Fields:

- id
- batchId
- quantity
- reason
- damageDate
- note

Business Notes:

Damaged quantity reduces stock.

---

# 17. StockAdjustment

Purpose:

Manual stock correction.

Fields:

- id
- batchId
- previousQuantity
- newQuantity
- reason
- adjustmentDate

---

# 18. StockMovement

Purpose:

Stores every stock movement.

Fields:

- id
- batchId
- movementType
- quantity
- referenceType
- referenceId
- movementDate

Business Notes:

Movement Types:

- Purchase

- Sale

- Return

- Damage

- Adjustment

---

# 19. User

Purpose:

System users.

Fields:

- id
- name
- username
- password
- roleId
- isActive
- createdAt

---

# 20. Role

Purpose:

User roles.

Examples:

- Owner
- Employee

Fields:

- id
- name
- description

---

# 21. Permission

Purpose:

Stores role permissions.

Fields:

- id
- roleId
- module
- canCreate
- canRead
- canUpdate
- canDelete

---

# 22. Settings

Purpose:

Shop information.

Fields:

- id
- shopName
- ownerName
- phone
- address
- invoicePrefix
- purchasePrefix
- currency

---

# 23. ActivityLog

Purpose:

Stores user activities.

Fields:

- id
- userId
- action
- module
- referenceId
- description
- createdAt

Business Notes:

Every important action will be recorded.


---

# Business Rules

These rules define how the system behaves when users perform different operations.

---

## Purchase Flow

When a Purchase is completed:

- Create Purchase record
- Create PurchaseItem records
- Create ProductBatch for each purchased product
- Increase Product Stock
- Update Supplier Due
- If payment is made, update Cash Book
- Save Activity Log

---

## Sale Flow

When a Sale is completed:

- Create Sale record
- Create SaleItem records
- Reduce ProductBatch quantity
- Calculate Profit
- Update Customer Due
- If payment is received, update Cash Book
- Save Activity Log

---

## Customer Payment Flow

When a customer pays:

- Create CustomerPayment record
- Reduce Customer Due
- Update Cash Book
- Save Activity Log

---

## Supplier Payment Flow

When supplier payment is made:

- Create SupplierPayment record
- Reduce Supplier Due
- Update Cash Book
- Save Activity Log

---

## Expense Flow

When an expense is added:

- Create Expense record
- Reduce Cash Book balance
- Save Activity Log

---

## Purchase Return Flow

When products are returned to supplier:

- Create PurchaseReturn record
- Reduce ProductBatch quantity
- Update Supplier Due
- Update Cash Book if refund received
- Save Activity Log

---

## Sale Return Flow

When customer returns products:

- Create SaleReturn record
- Increase ProductBatch quantity
- Update Customer Due
- Update Profit
- Update Cash Book if refund given
- Save Activity Log

---

## Damage Flow

When damaged products are entered:

- Create Damage record
- Reduce ProductBatch quantity
- Save Stock Movement
- Save Activity Log

---

## Stock Adjustment Flow

When stock is adjusted:

- Update ProductBatch quantity
- Create StockAdjustment record
- Save Stock Movement
- Save Activity Log

---

## Login Rules

- Only active users can login.
- Every user must have a role.
- Every action depends on user permissions.

---

## Permission Rules

Owner can:

- Manage everything

Employee can:

- Access only permitted modules
- Cannot delete protected records
- Cannot change system settings

---

## Auto Number Rules

Purchase Number Format

PUR-000001

Sale Invoice Format

INV-000001

---

## Product Rules

- Product name cannot be empty.
- Product must belong to one category.
- One product can have multiple batches.
- Batch quantity cannot be negative.
- Expiry date is required.

---

## Customer Rules

- Phone number should be unique.
- Customer Due can never be negative.

---

## Supplier Rules

- Phone number should be unique.
- Supplier Due can never be negative.

---

## Backup Rules

- Database can be backed up manually.
- Restore requires Owner permission.

---

## Activity Log Rules

The following actions must be recorded:

- Login
- Logout
- Product Add
- Product Update
- Product Delete
- Purchase
- Sale
- Payment
- Expense
- Stock Adjustment
- Damage
- Return
- Backup
- Restore

---

# End of Documentation