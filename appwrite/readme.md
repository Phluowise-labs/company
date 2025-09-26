# Phluowise Appwrite Database Schema

This document describes the database schema for the Phluowise application using Appwrite as the backend service.

## Overview

The Phluowise database consists of 12 collections that manage various aspects of a delivery and order management system. The schema supports multi-tenant architecture with company and branch-level organization.

## Database Collections

### 1. Customer Table (`customer_tb`)
Stores customer information and user profiles.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `full_name` | string | ✓ | 50 | Customer's full name |
| `phone_number` | string | ✓ | 15 | Primary phone number |
| `email` | string | ✓ | 50 | Email address |
| `user_type` | string | ✓ | 20 | Type of user (customer, admin, etc.) |
| `uid` | string | ✓ | 50 | Unique user identifier |
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |
| `phone_number2` | string | ✗ | 15 | Secondary phone number |

### 2. Company Table (`company_tb`)
Manages company information and settings.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Unique company identifier |
| `company_name` | string | ✓ | 50 | Company name |
| `email` | string | ✓ | 50 | Company email |
| `phone_number` | string | ✓ | 15 | Company phone |
| `location` | string | ✓ | 50 | Company location |
| `description` | string | ✗ | 250 | Company description |

### 3. Social Media (`social_media`)
Stores social media links and profiles for companies/branches.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |
| `facebook` | string | ✗ | 100 | Facebook profile URL |
| `linkedIn` | string | ✗ | 100 | LinkedIn profile URL |
| `instagram` | string | ✗ | 100 | Instagram profile URL |
| `discord` | string | ✗ | 100 | Discord server URL |

### 4. Working Days (`working_days`)
Defines operating hours and schedules.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `day` | string | ✓ | 20 | Day of the week |
| `time` | string | ✓ | 50 | Operating hours |
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |

### 5. Branches (`branches`)
Manages branch locations and information.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Parent company ID |
| `branch_id` | string | ✓ | 20 | Unique branch identifier |
| `branch_code` | string | ✓ | 10 | Branch code |
| `email` | string | ✓ | 50 | Branch email |
| `location` | string | ✓ | 50 | Branch location |
| `description` | string | ✗ | 250 | Branch description |

### 6. Drivers (`drivers`)
Manages delivery driver information and status.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✗ | 20 | Associated company ID |
| `branch_id` | string | ✗ | 20 | Associated branch ID |
| `name` | string | ✗ | 50 | Driver's name |
| `status` | enum | ✗ | - | Driver status: `online`, `offline`, `idle` |
| `last_seen_at` | datetime | ✗ | - | Last activity timestamp |
| `created_at` | datetime | ✗ | - | Account creation date |
| `publicName` | string | ✗ | 30 | Public display name |
| `phoneNumber` | string | ✗ | 15 | Driver's phone number |
| `emailAddress` | string | ✗ | 30 | Driver's email |
| `residence` | string | ✗ | 30 | Driver's address |
| `vehicleNumber` | string | ✗ | 20 | Vehicle registration number |
| `vehicleType` | string | ✗ | 20 | Type of vehicle |
| `id_type` | string | ✗ | 50 | ID document type |
| `idNumber` | string | ✗ | 70 | ID document number |
| `ID_Document_Images_Front` | string | ✗ | 250 | Front ID image URL |
| `ID_Document_Images_Back` | string | ✗ | 250 | Back ID image URL |

### 7. Orders (`orders`)
Core order management and tracking.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `order_id` | string | ✗ | 20 | Unique order identifier |
| `company_id` | string | ✗ | 20 | Associated company ID |
| `branch_id` | string | ✗ | 20 | Associated branch ID |
| `customer_id` | string | ✗ | 20 | Customer who placed the order |
| `customerName` | string | ✗ | 100 | Customer's full name |
| `customerLocation` | string | ✗ | 200 | Customer's delivery address |
| `customerPhone` | string | ✗ | 20 | Customer's phone number |
| `orderDate` | string | ✗ | 20 | Order date (YYYY-MM-DD) |
| `orderTime` | string | ✗ | 10 | Order time (HH:MM) |
| `totalAmount` | double | ✗ | - | Total order amount (0-99999.99) |
| `status` | enum | ✓ | - | Order status: `accepted`, `pending`, `denied`, `cancelled`, `completed` |
| `denied_at` | datetime | ✗ | - | Denial timestamp |
| `accepted_at` | datetime | ✗ | - | Acceptance timestamp |
| `created_at` | datetime | ✗ | - | Order creation timestamp |
| `cancelled_at` | datetime | ✗ | - | Cancellation timestamp |
| `completed_at` | datetime | ✗ | - | Completion timestamp |
| `notes` | string | ✗ | 250 | Additional order notes |
| `location` | string | ✗ | 30 | Delivery location |

### 8. Order Items (`order_items`)
Junction table linking orders to products with quantities.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `order_id` | string | ✓ | 20 | Reference to orders table |
| `product_id` | string | ✓ | 20 | Reference to product table |
| `quantity` | integer | ✓ | - | Product quantity (1-9999) |
| `unit_price` | double | ✓ | - | Price per unit at time of order (0-99999.99) |
| `company_id` | string | ✗ | 20 | Associated company ID |
| `branch_id` | string | ✗ | 20 | Associated branch ID |

### 9. Deliveries (`deliveries`)
Tracks delivery assignments and status.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |
| `order_id` | string | ✓ | 20 | Related order ID |
| `driver_id` | string | ✓ | 20 | Assigned driver ID |
| `status` | enum | ✓ | - | Delivery status: `dispatched`, `in_transit`, `completed`, `failed` |
| `failed_at` | datetime | ✗ | - | Failure timestamp |
| `completed_at` | datetime | ✗ | - | Completion timestamp |
| `created_at` | datetime | ✗ | - | Delivery creation timestamp |

### 10. Transactions (`transactions`)
Financial transaction records.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `txn_id` | string | ✓ | 20 | Unique transaction ID |
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |
| `order_id` | string | ✗ | 20 | Related order ID (optional) |
| `amount` | integer | ✓ | - | Transaction amount |
| `currency` | string | ✓ | 20 | Currency code |
| `status` | enum | ✓ | - | Transaction status: `pending`, `succeeded`, `failed` |

### 11. Ratings (`ratings`)
Customer feedback and rating system.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `company_id` | string | ✓ | 20 | Associated company ID |
| `branch_id` | string | ✓ | 20 | Associated branch ID |
| `order_id` | string | ✓ | 20 | Related order ID |
| `customer_id` | string | ✓ | 20 | Customer who rated |
| `rating` | integer | ✓ | - | Rating value |
| `comment` | string | ✗ | 250 | Optional feedback comment |
| `created_at` | datetime | ✗ | - | Rating timestamp |

### 12. Products (`product`)
Product catalog and inventory management.

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `product_id` | string | ✓ | 20 | Unique product identifier |
| `size` | string | ✗ | 20 | Product size |
| `quantity` | string | ✗ | 20 | Available quantity |
| `product_name` | string | ✗ | 20 | Product name |
| `price` | string | ✗ | 20 | Product price |
| `product_type` | string | ✗ | 20 | Category/type of product |
| `discount` | string | ✗ | 20 | Discount percentage |
| `currency` | string | ✗ | 20 | Price currency |
| `company_id` | string | ✗ | 20 | Associated company ID |
| `branch_id` | string | ✗ | 20 | Associated branch ID |
| `delivery_charge` | boolean | ✗ | - | Whether delivery charges apply |
| `product_image` | string | ✗ | 250 | Product image URL |

## Data Relationships

### Hierarchical Structure
```
Company (company_tb)
├── Branches (branches)
│   ├── Customers (customer_tb)
│   ├── Drivers (drivers)
│   ├── Orders (orders)
│   │   └── Order Items (order_items) → Products (product)
│   ├── Products (product)
│   ├── Deliveries (deliveries)
│   ├── Transactions (transactions)
│   ├── Ratings (ratings)
│   ├── Working Days (working_days)
│   └── Social Media (social_media)
```

### Key Relationships
- **Company → Branches**: One-to-many relationship
- **Branch → Orders**: One-to-many relationship
- **Orders → Order Items**: One-to-many relationship
- **Order Items → Products**: Many-to-one relationship
- **Orders → Deliveries**: One-to-one relationship
- **Orders → Transactions**: One-to-many relationship
- **Orders → Ratings**: One-to-one relationship
- **Customer → Orders**: One-to-many relationship
- **Driver → Deliveries**: One-to-many relationship

## Status Enumerations

### Order Status Flow
```
pending → accepted → completed
pending → denied
accepted → cancelled
```

### Delivery Status Flow
```
dispatched → in_transit → completed
dispatched → in_transit → failed
```

### Transaction Status
- `pending`: Payment processing
- `succeeded`: Payment completed
- `failed`: Payment failed

### Driver Status
- `online`: Available for deliveries
- `offline`: Not available
- `idle`: Online but not active

## Usage Notes

1. **Multi-tenancy**: The schema supports multiple companies with their own branches
2. **Role-based Access**: Different user types can access different data scopes
3. **Audit Trail**: Most collections include timestamp fields for tracking changes
4. **Flexible Design**: Many fields are optional to accommodate different business models
5. **Status Tracking**: Comprehensive status enums for order and delivery lifecycle management

## File Location
This schema is defined in: `appwrite-schema.json`

---
*Generated for Phluowise Application - Appwrite Database Schema Documentation*