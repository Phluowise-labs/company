# Phluowise Subscription System

## Overview

The Phluowise Subscription System is a comprehensive solution that manages user subscriptions, enforces access control, and handles payment processing. It implements the exact requirements specified in your project brief.

## Features

### 1. **Free Trial Management**
- **20-day free trial** automatically activated for new users
- Countdown timer showing remaining trial period
- Automatic transition to Basic Plan after trial expiry

### 2. **Subscription Plans**
- **Free Plan**: 20-day trial period
- **Basic Plan**: Transaction-based pricing (0.3+ per sale)
- **Premium Plan**: Coming soon (GH₵ 60/month)

### 3. **Access Control**
- **Real-time subscription status checking** on every app load
- **App blocking** when subscription expires or payment is overdue
- **Blurred background popup** with payment options
- **Only logout/signin allowed** when blocked

### 4. **Payment Enforcement**
- **3-hour payment status checks** (as per requirements)
- **Countdown timers** for overdue payments
- **Amount Owing display** with real-time updates
- **Multiple payment methods** (MTN, Vodafone, AirtelTigo)

### 5. **Countdown Timers**
- **Trial countdown**: Shows remaining days/hours/minutes
- **Plan countdown**: Shows remaining subscription time
- **Payment countdown**: Shows time until payment deadline

## File Structure

```
public/front/
├── subscription-manager.js      # Core subscription logic
├── access-control.js           # Global access control system
├── subscription-demo.js        # Demo/testing utilities
├── subscription.html           # Subscription management page
├── account.html               # Account page with Amount Owing
└── SUBSCRIPTION-SYSTEM-README.md
```

## How It Works

### 1. **User Registration Flow**
```
New User → Free Trial (20 days) → Trial Expiry → Basic Plan Activation
```

### 2. **Access Control Flow**
```
App Load → Check Subscription Status → 
├─ Valid → Allow Access
├─ Expired → Block App
├─ Payment Overdue → Block App
└─ Show Payment Popup
```

### 3. **Payment Flow**
```
Payment Due → Countdown Timer → Payment Overdue → Block App → 
Payment Made → Restore Access → Continue Usage
```

## Implementation Details

### Subscription Manager (`subscription-manager.js`)

The core class that handles:
- Subscription data management
- Trial and plan lifecycle
- Payment processing
- UI updates
- Local storage persistence

**Key Methods:**
- `initializeFreeTrial()`: Sets up 20-day free trial
- `activateBasicPlan()`: Activates Basic Plan after trial
- `checkAccessControl()`: Determines if app should be blocked
- `makePayment()`: Handles payment processing
- `startCountdown()`: Manages countdown timers

### Access Control (`access-control.js`)

Global system that:
- Runs on every page
- Checks subscription status
- Blocks app access when needed
- Shows payment popups
- Handles emergency access

**Key Features:**
- **Every 5 minutes**: Access control check
- **Every 3 hours**: Payment status check
- **Immediate blocking**: When conditions are met
- **Emergency access**: Admin override capability

### Integration Points

#### 1. **Subscription Page**
- Real-time countdown displays
- Plan activation buttons
- Payment information
- Subscription status overview

#### 2. **Account Page**
- Amount Owing section with countdown
- Payment button integration
- Subscription status display

#### 3. **All Other Pages**
- Automatic access control
- Subscription status checking
- Payment enforcement

## Usage Examples

### 1. **Check Subscription Status**
```javascript
if (window.subscriptionManager) {
    const status = subscriptionManager.getSubscriptionStatus();
    const isBlocked = subscriptionManager.isAppBlocked();
    const amountOwing = subscriptionManager.getAmountOwing();
}
```

### 2. **Force Access Check**
```javascript
if (window.accessControl) {
    accessControl.forceAccessCheck();
}
```

### 3. **Make Payment**
```javascript
if (window.subscriptionManager) {
    await subscriptionManager.makePayment();
}
```

## Testing with Demo Panel

The system includes a demo panel (visible in development) that allows you to:

1. **Set Free Trial**: Test 20-day trial functionality
2. **Set Basic Plan**: Test active subscription
3. **Set Expired Plan**: Test app blocking
4. **Set Overdue Payment**: Test payment enforcement
5. **Reset**: Clear all data and start fresh

## Configuration

### 1. **Trial Duration**
```javascript
// In subscription-manager.js
const trialEnd = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)); // 20 days
```

### 2. **Payment Check Interval**
```javascript
// In access-control.js
setInterval(() => {
    this.checkPaymentStatus();
}, 3 * 60 * 60 * 1000); // 3 hours
```

### 3. **Access Check Interval**
```javascript
// In access-control.js
setInterval(() => {
    this.checkAccess();
}, 5 * 60 * 1000); // 5 minutes
```

## Security Features

### 1. **Access Blocking**
- Prevents access to all app features
- Only allows logout/signin when blocked
- Emergency access for admin purposes

### 2. **Data Persistence**
- Local storage for subscription data
- Secure payment processing
- Session management

### 3. **Emergency Access**
- Admin override capability
- Secure access codes
- Audit trail

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: Responsive design for all devices
- **JavaScript**: ES6+ features supported

## Dependencies

- **SweetAlert2**: For beautiful popups
- **Font Awesome**: For icons
- **Tailwind CSS**: For styling
- **Alpine.js**: For reactive components

## Future Enhancements

### 1. **Backend Integration**
- Real payment processing APIs
- Database storage for subscription data
- User management system

### 2. **Advanced Features**
- Multiple subscription tiers
- Usage analytics
- Automated billing
- Email notifications

### 3. **Security Improvements**
- JWT tokens for authentication
- Encrypted data storage
- Rate limiting
- Audit logging

## Troubleshooting

### Common Issues

1. **Demo Panel Not Showing**
   - Ensure you're on localhost/127.0.0.1
   - Check browser console for errors
   - Wait 2 seconds for initialization

2. **Subscription Not Working**
   - Check if subscription-manager.js is loaded
   - Verify localStorage permissions
   - Check browser console for errors

3. **Access Control Not Blocking**
   - Ensure access-control.js is loaded
   - Check subscription data in localStorage
   - Verify blocking conditions are met

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For technical support or questions about the subscription system:
- Check browser console for error messages
- Review this documentation
- Test with demo panel
- Contact development team

---

**Note**: This system is designed to work with your existing Bootstrap-based UI framework, maintaining consistency with your current design while adding powerful subscription management capabilities.
