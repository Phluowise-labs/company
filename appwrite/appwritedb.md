# Appwrite Database Schema Documentation

This document provides a comprehensive overview of the Appwrite database schema for the Phluowise application. The database consists of 11 collections that manage customers, companies, orders, deliveries, transactions, ratings, products, and related data.

## Collections Overview

1. [Customer Table (`customer_tb`)](#customer-table-customer_tb)
2. [Company Table (`company_tb`)](#company-table-company_tb)
3. [Social Media (`social_media`)](#social-media-social_media)
4. [Working Days (`working_days`)](#working-days-working_days)
5. [Branches (`branches`)](#branches-branches)
6. [Drivers (`drivers`)](#drivers-drivers)
7. [Orders (`orders`)](#orders-orders)
8. [Deliveries (`deliveries`)](#deliveries-deliveries)
9. [Transactions (`transactions`)](#transactions-transactions)
10. [Ratings (`ratings`)](#ratings-ratings)
11. [Products (`product`)](#products-product)
12. [Order Items (`order_items`)](#order-items-order_items)

---

## Customer Table (`customer_tb`)

Stores customer information and profile data.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `customer_id` | string | ✓ | 20 | Unique customer identifier |
| `name` | string | ✓ | 50 | Customer full name |
| `email` | string | ✓ | 50 | Customer email address |
| `phone` | string | ✓ | 20 | Customer phone number |
| `address` | string | ✗ | 100 | Customer address |
| `city` | string | ✗ | 30 | Customer city |
| `state` | string | ✗ | 30 | Customer state |
| `country` | string | ✗ | 30 | Customer country |
| `postal_code` | string | ✗ | 20 | Postal/ZIP code |
| `created_at` | datetime | ✗ | - | Account creation timestamp |
| `id_type` | string | ✗ | 50 | Type of ID document |
| `idNumber` | string | ✗ | 70 | ID document number |
| `ID_Document_Images_Front` | string | ✗ | 250 | Front ID document image URL |
| `ID_Document_Images_Back` | string | ✗ | 250 | Back ID document image URL |
| `profile_image` | string | ✗ | 250 | Profile image URL |

---

## Company Table (`company_tb`)

Stores company/business information.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Unique company identifier |
| `company_name` | string | ✓ | 50 | Company name |
| `email` | string | ✓ | 50 | Company email address |
| `phone` | string | ✓ | 20 | Company phone number |
| `address` | string | ✗ | 100 | Company address |
| `city` | string | ✗ | 30 | Company city |
| `state` | string | ✗ | 30 | Company state |
| `country` | string | ✗ | 30 | Company country |
| `postal_code` | string | ✗ | 20 | Postal/ZIP code |
| `created_at` | datetime | ✗ | - | Company registration timestamp |
| `logo` | string | ✗ | 250 | Company logo URL |
| `description` | string | ✗ | 500 | Company description |
| `website` | string | ✗ | 100 | Company website URL |
| `industry` | string | ✗ | 50 | Industry type |
| `company_size` | string | ✗ | 20 | Company size category |
| `founded_year` | integer | ✗ | - | Year company was founded |
| `tax_id` | string | ✗ | 50 | Tax identification number |
| `business_license` | string | ✗ | 100 | Business license number |
| `status` | enum | ✓ | - | Company status: `active`, `inactive`, `suspended` |

---

## Social Media (`social_media`)

Stores social media links for companies.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Reference to company |
| `platform` | string | ✓ | 30 | Social media platform name |
| `url` | string | ✓ | 200 | Social media profile URL |
| `created_at` | datetime | ✗ | - | Record creation timestamp |

---

## Working Days (`working_days`)

Defines operating hours for companies.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Reference to company |
| `day_of_week` | enum | ✓ | - | Day: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` |
| `is_open` | boolean | ✓ | - | Whether company is open on this day |
| `open_time` | string | ✗ | 10 | Opening time (HH:MM format) |
| `close_time` | string | ✗ | 10 | Closing time (HH:MM format) |
| `created_at` | datetime | ✗ | - | Record creation timestamp |

---

## Branches (`branches`)

Stores branch/location information for companies.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `branch_id` | string | ✓ | 20 | Unique branch identifier |
| `company_id` | string | ✓ | 20 | Reference to parent company |
| `branch_name` | string | ✓ | 50 | Branch name |
| `address` | string | ✓ | 100 | Branch address |
| `city` | string | ✓ | 30 | Branch city |
| `state` | string | ✓ | 30 | Branch state |
| `country` | string | ✓ | 30 | Branch country |
| `postal_code` | string | ✗ | 20 | Postal/ZIP code |
| `phone` | string | ✗ | 20 | Branch phone number |
| `email` | string | ✗ | 50 | Branch email address |
| `manager_name` | string | ✗ | 50 | Branch manager name |
| `created_at` | datetime | ✗ | - | Branch creation timestamp |
| `status` | enum | ✓ | - | Branch status: `active`, `inactive` |

---

## Drivers (`drivers`)

Stores delivery driver information.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `driver_id` | string | ✓ | 20 | Unique driver identifier |
| `company_id` | string | ✓ | 20 | Reference to company |
| `branch_id` | string | ✓ | 20 | Reference to branch |
| `name` | string | ✓ | 50 | Driver full name |
| `email` | string | ✓ | 50 | Driver email address |
| `phone` | string | ✓ | 20 | Driver phone number |
| `license_number` | string | ✓ | 30 | Driver's license number |
| `vehicle_type` | string | ✗ | 30 | Type of delivery vehicle |
| `vehicle_number` | string | ✗ | 20 | Vehicle registration number |
| `created_at` | datetime | ✗ | - | Driver registration timestamp |
| `status` | enum | ✓ | - | Driver status: `active`, `inactive`, `suspended` |

---

## Orders (`orders`)

Stores customer order information.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `order_id` | string | ✗ | 20 | Unique order identifier |
| `company_id` | string | ✗ | 20 | Reference to company |
| `branch_id` | string | ✗ | 20 | Reference to branch |
| `customer_id` | string | ✗ | 20 | Reference to customer |
| `status` | enum | ✓ | - | Order status: `accepted`, `pending`, `denied`, `cancelled`, `completed` |
| `denied_at` | datetime | ✗ | - | Order denial timestamp |
| `accepted_at` | datetime | ✗ | - | Order acceptance timestamp |
| `created_at` | datetime | ✗ | - | Order creation timestamp |
| `cancelled_at` | datetime | ✗ | - | Order cancellation timestamp |
| `completed_at` | datetime | ✗ | - | Order completion timestamp |
| `notes` | string | ✗ | 250 | Order notes/comments |
| `customerLocation` | string | ✗ | 200 | Customer delivery location |
| `customerName` | string | ✗ | 100 | Customer name for order |
| `orderTime` | string | ✗ | 10 | Preferred delivery time |
| `customerPhone` | string | ✗ | 20 | Customer phone for order |
| `totalAmount` | double | ✗ | - | Total order amount |
| `orderDate` | string | ✗ | 50 | Order date |

---

## Deliveries (`deliveries`)

Tracks delivery information for orders.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `delivery_id` | string | ✓ | 20 | Unique delivery identifier |
| `company_id` | string | ✓ | 20 | Reference to company |
| `branch_id` | string | ✓ | 20 | Reference to branch |
| `order_id` | string | ✓ | 20 | Reference to order |
| `driver_id` | string | ✓ | 20 | Reference to assigned driver |
| `status` | enum | ✓ | - | Delivery status: `dispatched`, `in_transit`, `completed`, `failed` |
| `failed_at` | datetime | ✗ | - | Delivery failure timestamp |
| `completed_at` | datetime | ✗ | - | Delivery completion timestamp |
| `created_at` | datetime | ✗ | - | Delivery creation timestamp |

---

## Transactions (`transactions`)

Stores payment transaction records.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `txn_id` | string | ✓ | 20 | Unique transaction identifier |
| `company_id` | string | ✓ | 20 | Reference to company |
| `branch_id` | string | ✓ | 20 | Reference to branch |
| `order_id` | string | ✗ | 20 | Reference to order (if applicable) |
| `amount` | integer | ✓ | - | Transaction amount |
| `currency` | string | ✓ | 20 | Currency code |
| `status` | enum | ✓ | - | Transaction status: `pending`, `succeeded`, `failed` |
| `created_at` | datetime | ✗ | - | Transaction timestamp |
| `amountPhluowise` | string | ✗ | 20 | Phluowise commission amount |
| `paymentMethod` | string | ✗ | 20 | Payment method used |

---

## Ratings (`ratings`)

Stores customer ratings and reviews.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `rating_id` | string | ✓ | 20 | Unique rating identifier |
| `company_id` | string | ✓ | 20 | Reference to company |
| `branch_id` | string | ✓ | 20 | Reference to branch |
| `order_id` | string | ✗ | 20 | Reference to order (if applicable) |
| `customer_id` | string | ✓ | 20 | Reference to customer |
| `stars` | integer | ✓ | - | Rating (1-5 stars) |
| `comment` | string | ✗ | 225 | Customer review comment |
| `created_at` | datetime | ✗ | - | Rating submission timestamp |
| `location` | string | ✗ | 30 | Location where service was provided |

**Constraints:**
- `stars`: Min value = 1, Max value = 5

---

## Products (`product`)

Stores product catalog information.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `product_id` | string | ✓ | 20 | Unique product identifier |
| `size` | string | ✗ | 20 | Product size |
| `quantity` | string | ✗ | 20 | Available quantity |
| `product_name` | string | ✗ | 20 | Product name |
| `price` | string | ✗ | 20 | Product price |
| `product_type` | string | ✗ | 20 | Product category/type |
| `discount` | string | ✗ | 20 | Discount percentage/amount |
| `currency` | string | ✗ | 20 | Price currency |
| `company_id` | string | ✗ | 20 | Reference to company |
| `branch_id` | string | ✗ | 20 | Reference to branch |
| `delivery_charge` | boolean | ✗ | - | Whether delivery charge applies |
| `product_image` | string | ✗ | 250 | Product image URL |

---

## Order Items (`order_items`)

Stores individual items within orders.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `order_id` | string | ✓ | 50 | Reference to order |
| `product_id` | string | ✓ | 50 | Reference to product |
| `quantity` | integer | ✓ | - | Quantity ordered |
| `company_id` | string | ✓ | 50 | Reference to company |
| `branch_id` | string | ✓ | 50 | Reference to branch |
| `unit_price` | double | ✓ | - | Price per unit at time of order |

---

## Relationships

### Primary Relationships
- **Companies** have multiple **Branches**
- **Companies** have multiple **Drivers**
- **Companies** have multiple **Products**
- **Companies** have **Social Media** profiles
- **Companies** have **Working Days** schedules

### Order Flow
- **Customers** place **Orders**
- **Orders** contain multiple **Order Items**
- **Order Items** reference **Products**
- **Orders** generate **Deliveries**
- **Deliveries** are assigned to **Drivers**
- **Orders** generate **Transactions**
- **Customers** can leave **Ratings**

### Key Foreign Keys
- `company_id`: Links records to companies
- `branch_id`: Links records to specific branches
- `customer_id`: Links records to customers
- `order_id`: Links records to orders
- `driver_id`: Links records to drivers
- `product_id`: Links records to products

---

## Status Enums

### Order Status
- `pending`: Order submitted, awaiting acceptance
- `accepted`: Order accepted by company
- `denied`: Order rejected
- `cancelled`: Order cancelled
- `completed`: Order fulfilled

### Delivery Status
- `dispatched`: Delivery assigned and dispatched
- `in_transit`: Delivery in progress
- `completed`: Delivery successful
- `failed`: Delivery failed

### Transaction Status
- `pending`: Payment processing
- `succeeded`: Payment successful
- `failed`: Payment failed

### Company/Branch/Driver Status
- `active`: Currently operational
- `inactive`: Temporarily disabled
- `suspended`: Suspended due to violations

---

## Notes

1. **ID Fields**: Most ID fields are 20-character strings for consistent identification
2. **Timestamps**: All datetime fields store creation and status change timestamps
3. **Flexibility**: Many fields are optional to accommodate different business models
4. **Images**: Image fields store URLs (typically 250 characters) pointing to stored files
5. **Enums**: Status fields use predefined enums for data consistency
6. **Pricing**: Both string and numeric fields are used for pricing to handle different currencies and formats

This schema supports a comprehensive delivery/e-commerce platform with multi-tenant company support, order management, delivery tracking, and customer feedback systems.