# Transactions Page Documentation

## Overview

The Transactions Page is a comprehensive financial dashboard that displays transaction records for businesses using the Phluowise platform. It provides both card and table views of transaction data, with real-time filtering, search functionality, and Excel export capabilities.

## File Structure

```
├── transactions.html          # Main HTML page
├── js/
│   ├── transactions.js        # Transaction management logic
│   └── config.js             # Appwrite configuration
├── topbar.html               # Navigation bar component
└── sidebar.html              # Sidebar navigation component
```

## Architecture Overview

### Frontend Components

- **HTML Structure**: `transactions.html`
- **JavaScript Logic**: `js/transactions.js` (ES6 Module)
- **Styling**: TailwindCSS with custom glassmorphism effects
- **External Libraries**:
  - Alpine.js for reactive components
  - SheetJS (XLSX) for Excel export
  - SweetAlert2 for notifications
  - Font Awesome for icons

### Backend Integration

- **Database**: Appwrite Cloud Database
- **Authentication**: localStorage-based session management
- **API**: Appwrite SDK for database operations

## Data Flow Architecture

### 1. Authentication & Context Resolution

```javascript
getCurrentContext() {
    // Priority order for company ID resolution:
    // 1. localStorage.getItem('companyId') - from authManager.js
    // 2. localStorage.getItem('loggedInCompany') - from company-auth.js
    // 3. localStorage.getItem('user') - fallback user data

    // Authentication validation:
    // - authToken presence
    // - user data availability
    // - companyId resolution
}
```

**Authentication Flow:**

1. Check `companyId` from `authManager.js`
2. Fallback to `loggedInCompany` from `company-auth.js`
3. Extract company ID from user data if needed
4. Validate authentication tokens
5. Throw error if authentication fails

### 2. Data Fetching Process

```mermaid
graph TD
    A[Page Load] --> B[getCurrentContext()]
    B --> C{Authentication Valid?}
    C -->|No| D[Show Error Message]
    C -->|Yes| E[Build Appwrite Queries]
    E --> F[Fetch Transactions from DB]
    F --> G[Fetch Related Customer Data]
    G --> H[Transform & Format Data]
    H --> I[Render Views]
    I --> J[Setup Event Listeners]
```

**Query Construction:**

```javascript
const queries = [
  Appwrite.Query.equal("company_id", companyId),
  Appwrite.Query.orderDesc("created_at"),
  Appwrite.Query.limit(100),
];

// Optional branch filtering
if (branchId && branchId !== companyId) {
  queries.push(Appwrite.Query.equal("branch_id", branchId));
}
```

### 3. Data Transformation Pipeline

#### Raw Appwrite Document → Formatted Transaction Object

```javascript
// Input: Appwrite transaction document
{
    $id: "transaction_id",
    txn_id: "TXN_12345",
    order_id: "ORDER_67890",
    amount: 5000, // in cents
    status: "succeeded",
    paymentMethod: "mobile_money",
    currency: "GHS",
    created_at: "2024-01-15T10:30:00Z",
    company_id: "company_123",
    branch_id: "branch_456"
}

// Output: Formatted transaction object
{
    id: "TXN_12345",
    image: "../images/user.png",
    name: "John Doe",
    status: "Payment Successful",
    time: "10:30 AM",
    date: "2024-01-15",
    amountReceived: "50.00",
    amountPhluowise: "5.00",
    paymentMethod: "mobile_money",
    currency: "GHS"
}
```

#### Customer Data Resolution

1. **Order Lookup**: Use `order_id` to find order document
2. **Customer Fetch**: Extract `customer_id` from order
3. **Customer Cache**: Store customer data in Map for performance
4. **Fallback Handling**: Default to "N/A" if customer not found

#### Date/Time Formatting

- **Date**: ISO format (YYYY-MM-DD)
- **Time**: 12-hour format with AM/PM
- **Timezone**: Local browser timezone

#### Amount Processing

- **Input**: Amounts stored in cents (integer)
- **Output**: Decimal format with 2 decimal places
- **Currency**: Dynamic currency symbol support

## Database Schema

### Transactions Collection (`transactions`)

```json
{
  "txn_id": "string", // Unique transaction ID
  "order_id": "string", // Related order ID
  "company_id": "string", // Company identifier
  "branch_id": "string", // Branch identifier
  "amount": "number", // Amount in cents
  "amountPhluowise": "number", // Platform fee in cents
  "status": "string", // succeeded|failed|pending
  "paymentMethod": "string", // Payment method used
  "currency": "string", // Currency code (GHS, USD, etc.)
  "created_at": "datetime", // Transaction timestamp
  "$id": "string", // Appwrite document ID
  "$createdAt": "datetime" // Appwrite creation timestamp
}
```

### Related Collections

- **Orders Collection**: Links transactions to customer orders
- **Customers Collection**: Provides customer names and profile images
- **Companies Collection**: Company-level data and settings
- **Branches Collection**: Branch-specific information

## User Interface Components

### 1. Navigation Tabs

```html
<button onclick="showTab('cards_view')">Cards View</button>
<button onclick="showTab('table_view')">Table View</button>
```

### 2. Cards View

- **Layout**: Responsive grid (1-2 columns based on screen size)
- **Card Content**: Customer image, name, status, timestamp, amounts
- **Styling**: Glassmorphism effect with hover states

### 3. Table View

- **Columns**: ID, Image, Name, Status, Time, Date, Amount Received, Amount to Phluowise, Payment Method
- **Features**:
  - Sortable columns
  - Hover effects
  - Status badges with color coding
  - Responsive design with horizontal scroll

### 4. Search Functionality

```javascript
// Real-time search across all transaction fields
const filteredData = transactionsData.filter((transaction) => {
  return Object.values(transaction).some((val) =>
    String(val).toLowerCase().includes(searchTerm)
  );
});
```

### 5. Footer Summary

- **Today's Totals**: Real-time calculation of daily totals
- **View Details**: Toggle between all transactions and today's transactions
- **Dynamic Currency**: Adapts to transaction currency

## Features & Functionality

### 1. Real-time Data Loading

- **Loading States**: Spinner animations during data fetch
- **Error Handling**: User-friendly error messages
- **Retry Logic**: Automatic retry on network failures

### 2. Export to Excel

```javascript
// XLSX library integration
const header = ["ID", "Image", "Name", "Status", "Time", "Date", "Amount Received", "Amount to Phluowise", "Payment Method"];
const rows = transactionsData.map(transaction => [...]);
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
XLSX.utils.book_append_sheet(wb, ws, "Transactions");
XLSX.writeFile(wb, "transactions.xlsx");
```

### 3. Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: Tailored layouts for different screen sizes
- **Touch-friendly**: Large touch targets and gestures

### 4. Performance Optimizations

- **Customer Caching**: Map-based cache for customer data
- **Lazy Loading**: Load customer data only when needed
- **Query Limits**: Limit to 100 recent transactions
- **Debounced Search**: Prevent excessive filtering operations

## Error Handling

### Authentication Errors

```javascript
if (!companyId && !authToken && !user) {
  throw new Error("Company ID not found. Please ensure you are logged in.");
}
```

### Data Fetching Errors

- **Network Failures**: Retry with exponential backoff
- **Permission Errors**: Redirect to login page
- **Data Corruption**: Fallback to default values

### User Experience

- **Loading States**: Visual feedback during operations
- **Error Messages**: Clear, actionable error descriptions
- **Graceful Degradation**: Partial functionality when some data is unavailable

## Security Considerations

### 1. Authentication

- **Token Validation**: Check for valid authentication tokens
- **Session Management**: Automatic logout on token expiry
- **Company Isolation**: Filter data by company/branch context

### 2. Data Access

- **Query Filtering**: Automatic company/branch filtering
- **Permission Checks**: Validate user permissions before data access
- **Input Sanitization**: Sanitize search inputs and user data

### 3. Client-side Security

- **No Sensitive Data**: Avoid storing sensitive information in localStorage
- **HTTPS Only**: Ensure all API calls use HTTPS
- **XSS Prevention**: Sanitize all user-generated content

## Configuration

### Appwrite Setup

```javascript
// config.js
export const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT = "68b17582003582da69c8";
export const DB_ID = "68b1b7590035346a3be9";
export const TRANSACTIONS_COLL = "transactions";
export const CUSTOMERS_COLL = "customer_tb";
```

### Environment Variables

- **APPWRITE_ENDPOINT**: Appwrite server endpoint
- **APPWRITE_PROJECT**: Project ID
- **DB_ID**: Database identifier
- **Collection IDs**: Various collection identifiers

## Testing & Debugging

### 1. Console Logging

- **Transaction Fetching**: Log query parameters and results
- **Customer Resolution**: Log customer lookup attempts
- **Error Tracking**: Detailed error logging with stack traces

### 2. Development Tools

- **Browser DevTools**: Network tab for API monitoring
- **Appwrite Console**: Database query testing
- **Local Storage Inspector**: Authentication state debugging

### 3. Common Issues

- **Authentication Failures**: Check localStorage keys and values
- **Empty Data**: Verify database permissions and query filters
- **Performance Issues**: Monitor network requests and caching

## Deployment Considerations

### 1. Production Setup

- **CDN Configuration**: Optimize asset delivery
- **Caching Strategy**: Implement appropriate cache headers
- **Error Monitoring**: Set up error tracking and alerting

### 2. Performance Monitoring

- **Load Times**: Monitor page load performance
- **API Response Times**: Track database query performance
- **User Experience**: Monitor user interaction patterns

### 3. Maintenance

- **Regular Updates**: Keep dependencies updated
- **Database Optimization**: Monitor and optimize queries
- **User Feedback**: Collect and act on user feedback

## Future Enhancements

### 1. Advanced Filtering

- **Date Range Filters**: Custom date range selection
- **Status Filters**: Filter by transaction status
- **Amount Filters**: Filter by amount ranges

### 2. Real-time Updates

- **WebSocket Integration**: Real-time transaction updates
- **Push Notifications**: Alert users of new transactions
- **Live Dashboard**: Real-time metrics and charts

### 3. Analytics Integration

- **Transaction Analytics**: Detailed transaction analysis
- **Revenue Tracking**: Advanced revenue metrics
- **Customer Insights**: Customer behavior analysis

## Conclusion

The Transactions Page provides a robust, scalable solution for transaction management with a focus on user experience, performance, and security. The modular architecture allows for easy maintenance and future enhancements while ensuring reliable data handling and presentation.
