# Subscription System Database Schema

## Overview
Time-based subscription system that provides full app access for a period, then blocks access until payment is completed.

## Subscription Collection Schema

### Collection: `subscriptions`

| Field | Type | Required | Size | Description |
|-------|------|----------|------|-------------|
| `subscription_id` | string | ✓ | 20 | Unique subscription identifier |
| `company_id` | string | ✓ | 20 | Links to company_tb |
| `plan_type` | string | ✓ | 20 | Subscription plan type |
| `status` | string | ✓ | 20 | Current subscription status |
| `start_date` | datetime | ✓ | - | Subscription start date |
| `end_date` | datetime | ✓ | - | Subscription expiry date |
| `trial_end_date` | datetime | ✗ | - | Free trial end date |
| `payment_due_date` | datetime | ✗ | - | When payment is due |
| `amount_due` | double | ✗ | - | Amount owed |
| `last_payment_date` | datetime | ✗ | - | Last successful payment |
| `is_blocked` | boolean | ✓ | - | Access blocked status |
| `blocked_at` | datetime | ✗ | - | When access was blocked |
| `grace_period_end` | datetime | ✗ | - | End of grace period |
| `created_at` | datetime | ✓ | - | Record creation date |
| `updated_at` | datetime | ✓ | - | Last update date |

## Plan Types
- `free_trial`: 20-30 day trial period
- `basic`: Monthly basic plan
- `premium`: Monthly premium plan
- `enterprise`: Custom enterprise plan

## Status Values
- `active`: Subscription is active and valid
- `expired`: Subscription has expired
- `payment_overdue`: Payment is overdue
- `blocked`: Access is blocked
- `cancelled`: Subscription cancelled

## Subscription Flow

### 1. Free Trial
- New company gets 20-30 days full access
- `status`: "active"
- `plan_type`: "free_trial"
- `end_date`: trial_end_date

### 2. Trial Expiry
- Trial period ends
- `status`: "expired"
- `is_blocked`: true
- `blocked_at`: current timestamp
- `payment_due_date`: set to 7 days from expiry
- App access blocked

### 3. Grace Period
- 7 days to make payment
- App remains blocked
- Payment reminders sent

### 4. Payment Made
- `status`: "active"
- `is_blocked`: false
- `blocked_at`: null
- `last_payment_date`: current timestamp
- `end_date`: extended by subscription period
- App access restored

### 5. Payment Overdue
- Grace period expires without payment
- `status`: "payment_overdue"
- Permanent block until payment

## Access Control Logic

```javascript
function checkSubscriptionAccess(subscription) {
  const now = new Date();
  
  // Check if blocked
  if (subscription.is_blocked) {
    return { access: false, reason: "blocked" };
  }
  
  // Check if expired
  if (now > subscription.end_date) {
    return { access: false, reason: "expired" };
  }
  
  // Check if payment overdue
  if (subscription.payment_due_date && now > subscription.payment_due_date) {
    return { access: false, reason: "payment_overdue" };
  }
  
  return { access: true };
}
```

## Integration Points

### 1. App Initialization
- Check subscription status on app load
- Block UI if subscription invalid
- Show payment prompt if needed

### 2. Periodic Checks
- Check subscription status every hour
- Update UI based on status changes
- Handle expiry during active sessions

### 3. Payment Processing
- Update subscription on successful payment
- Unblock access immediately
- Extend subscription period

## Database Relationships

- `subscriptions.company_id` → `company_tb.company_id`
- One-to-one relationship (one subscription per company)
- Cascade updates when company data changes

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Database       │    │  Subscription    │    │  Payment        │
│  Schema & Setup │───▶│  Manager         │───▶│  Integration    │
│                 │    │  (Core Logic)    │    │  (Processing)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │  User Interface  │◀────────────┘
         │              │  (Subscription   │
         │              │   & Test Pages)  │
         └─────────────▶└──────────────────┘