# Phluowise Business Dashboard Homepages

This directory contains role-based homepages for the Phluowise business management system, designed to provide different interfaces for administrators and branch staff.

## Files Overview

### 1. `admin-home.html` - Admin Dashboard
**Purpose**: Comprehensive business overview for administrators managing multiple branches

**Key Features**:
- **Dashboard & KPIs**: Sales overview, order summary, customer metrics, traffic & conversion
- **Quick Access & Alerts**: Recent orders, low stock alerts, pending tasks, system health
- **Navigation & Menu**: Core modules (Orders, Products, Customers, Catalog, Promotions, Content)
- **Reporting**: Advanced reports for sales, taxes, customers
- **Configuration**: Settings for payment gateways, shipping methods, taxes, store information, user roles
- **User Management**: Manage other admin and staff users
- **Activity Feed**: Live log of significant events across the system

**Target Users**: Business owners, administrators, managers

### 2. `branch-home.html` - Branch Dashboard
**Purpose**: Daily operations and customer service interface for branch staff

**Key Features**:
- **Daily Operations**: In-store sales, local stock levels, customer service
- **Inventory Management**: Stock receiving, adjusting, transferring, local stock monitoring
- **Customer Service**: Walk-in customers, phone orders, returns processing
- **Pickup Management**: Process in-store pickups and returns
- **Branch Alerts**: Low local stock, pickups ready, stock transfers
- **Local Reports**: Daily sales, end-of-day summaries

**Target Users**: Branch managers, store staff, customer service representatives

### 3. `role-manager.js` - Role Management System
**Purpose**: Handles role-based routing, authentication, and interface switching

**Key Features**:
- Role-based navigation menu generation
- Permission checking system
- Role switching functionality
- Interface updates based on user role
- Local storage for role persistence

## Usage Instructions

### Accessing the Dashboards

1. **Admin Dashboard**: Navigate to `admin-home.html`
2. **Branch Dashboard**: Navigate to `branch-home.html`

### Role Switching

The system includes a role switcher that allows users to toggle between admin and branch views:

1. Look for the role switcher button in the top navigation bar
2. Click to switch between "Admin Mode" and "Branch Mode"
3. The interface will automatically update to show the appropriate navigation and content

### Navigation Structure

#### Admin Navigation
- **Dashboard**: Overview, Analytics, Branches
- **Operations**: Orders, Products, Customers, Drivers
- **Finance**: Payments, Transactions, Reports
- **Settings**: System, Users

#### Branch Navigation
- **Branch Operations**: Dashboard, Inventory, Local Orders, Pickups
- **Customer Service**: Walk-in Customers, Phone Orders, Returns
- **Stock Management**: Stock Levels, Transfers, Stock Count
- **Reports**: Daily Sales, End of Day

## Technical Implementation

### Dependencies
- **Tailwind CSS**: For styling and responsive design
- **Font Awesome**: For icons
- **Chart.js**: For data visualization
- **Alpine.js**: For interactive components
- **SweetAlert2**: For notifications and confirmations

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for mobile and tablet devices

### Local Storage
The system uses localStorage to persist user role preferences across browser sessions.

## Customization

### Adding New Features
1. **Admin Features**: Add to the admin navigation in `role-manager.js`
2. **Branch Features**: Add to the branch navigation in `role-manager.js`
3. **Shared Features**: Implement in both dashboards as needed

### Styling
- Modify Tailwind classes in the HTML files
- Update CSS custom properties in the `<style>` sections
- Adjust color schemes and layouts as needed

### Data Integration
- Replace placeholder data with real API calls
- Integrate with your existing backend systems
- Add real-time updates for live data

## Security Considerations

### Role-Based Access Control
- Implement proper authentication before allowing role switching
- Validate user permissions on the server side
- Use secure session management

### Data Protection
- Ensure sensitive business data is properly secured
- Implement proper API authentication
- Use HTTPS for all communications

## Future Enhancements

### Planned Features
- Real-time notifications and alerts
- Advanced analytics and reporting
- Mobile app integration
- Multi-language support
- Advanced permission management

### Integration Points
- Customer relationship management (CRM)
- Enterprise resource planning (ERP)
- Payment gateway systems
- Shipping and logistics platforms
- Accounting software

## Support and Maintenance

### Troubleshooting
1. **Role Switching Issues**: Clear browser localStorage and refresh
2. **Navigation Problems**: Check console for JavaScript errors
3. **Styling Issues**: Verify Tailwind CSS is loading properly

### Updates
- Keep dependencies updated for security and performance
- Test role switching functionality after major updates
- Maintain consistent styling across both dashboards

## Contributing

When contributing to these homepages:
1. Maintain the role-based separation
2. Follow the existing design patterns
3. Test both admin and branch views
4. Ensure responsive design compatibility
5. Update documentation for new features

---

**Note**: This is a beta version (1.0.00) of the Phluowise Business Dashboard. Features and functionality may change in future releases.
