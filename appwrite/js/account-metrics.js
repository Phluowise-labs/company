// =============================
// Account Metrics Service
// =============================

// Appwrite configuration (inline like driver.js)
const METRICS_APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
const METRICS_APPWRITE_PROJECT = "68b17582003582da69c8";
const METRICS_DB_ID = "68b1b7590035346a3be9";
const METRICS_TRANSACTIONS_COLL = "transactions";
const METRICS_ORDERS_COLL = "orders";

// Initialize Appwrite client (using global Appwrite from CDN)
const metricsClient = new Appwrite.Client()
  .setEndpoint(METRICS_APPWRITE_ENDPOINT)
  .setProject(METRICS_APPWRITE_PROJECT);

const metricsDatabases = new Appwrite.Databases(metricsClient);

class AccountMetrics {
    constructor() {
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    /**
     * Fetch and aggregate transaction data for charts
     * @param {string} companyId - Company ID
     * @param {string} branchId - Branch ID (optional, if null gets all company data)
     * @returns {Object} Aggregated transaction data by year and month
     */
    async fetchTransactionData(companyId, branchId = null) {
        try {
            const queries = [
                Appwrite.Query.equal('company_id', companyId),
                Appwrite.Query.equal('status', 'succeeded'), // Only successful transactions
                Appwrite.Query.orderDesc('created_at'),
                Appwrite.Query.limit(1000) // Limit to prevent large data loads
            ];

            // Add branch filter if specified
            if (branchId) {
                queries.push(Appwrite.Query.equal('branch_id', branchId));
            }

            const response = await metricsDatabases.listDocuments(METRICS_DB_ID, METRICS_TRANSACTIONS_COLL, queries);
            
            return this.aggregateTransactionsByDate(response.documents);
        } catch (error) {
            console.error('Error fetching transaction data:', error);
            return this.getFallbackTransactionData();
        }
    }

    /**
     * Aggregate transactions by year and month
     * @param {Array} transactions - Array of transaction documents
     * @returns {Object} Aggregated data by year
     */
    aggregateTransactionsByDate(transactions) {
        const aggregated = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.created_at);
            const year = date.getFullYear().toString();
            const month = date.getMonth(); // 0-based month
            const amount = parseFloat(transaction.amount) || 0;

            if (!aggregated[year]) {
                aggregated[year] = Array(12).fill(0).map((_, index) => ({
                    month: this.monthNames[index],
                    amount: 0
                }));
            }

            aggregated[year][month].amount += amount;
        });

        return aggregated;
    }

    /**
     * Calculate dashboard metrics
     * @param {string} companyId - Company ID
     * @param {string} branchId - Branch ID (optional)
     * @returns {Object} Dashboard metrics
     */
    async calculateDashboardMetrics(companyId, branchId = null) {
        try {
            const [transactionData, orderMetrics] = await Promise.all([
                this.fetchTransactionData(companyId, branchId),
                this.fetchOrderMetrics(companyId, branchId)
            ]);

            const currentYear = new Date().getFullYear().toString();
            const currentYearTransactions = transactionData[currentYear] || [];
            
            // Calculate total revenue for current year
            const totalRevenue = currentYearTransactions.reduce((sum, month) => sum + month.amount, 0);
            
            // Calculate growth (mock calculation - compare with previous year)
            const previousYear = (parseInt(currentYear) - 1).toString();
            const previousYearTransactions = transactionData[previousYear] || [];
            const previousRevenue = previousYearTransactions.reduce((sum, month) => sum + month.amount, 0);
            const revenueGrowth = previousRevenue > 0 ? 
                ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;

            return {
                totalRevenue: totalRevenue.toFixed(2),
                revenueGrowth: `${revenueGrowth}%`,
                totalOrders: orderMetrics.totalOrders,
                ordersGrowth: orderMetrics.ordersGrowth,
                totalRequests: orderMetrics.pendingOrders + orderMetrics.totalOrders,
                totalPayments: (totalRevenue * 0.1).toFixed(2), // 10% commission
                transactionData: transactionData
            };
        } catch (error) {
            console.error('Error calculating dashboard metrics:', error);
            return this.getFallbackMetrics();
        }
    }

    /**
     * Fetch order-related metrics
     * @param {string} companyId - Company ID
     * @param {string} branchId - Branch ID (optional)
     * @returns {Object} Order metrics
     */
    async fetchOrderMetrics(companyId, branchId = null) {
        try {
            const queries = [
                Appwrite.Query.equal('company_id', companyId),
                Appwrite.Query.limit(1000)
            ];

            if (branchId) {
                queries.push(Appwrite.Query.equal('branch_id', branchId));
            }

            const response = await metricsDatabases.listDocuments(METRICS_DB_ID, METRICS_ORDERS_COLL, queries);
            const orders = response.documents;

            const currentYear = new Date().getFullYear();
            const currentYearOrders = orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.getFullYear() === currentYear;
            });

            const previousYear = currentYear - 1;
            const previousYearOrders = orders.filter(order => {
                const orderDate = new Date(order.created_at);
                return orderDate.getFullYear() === previousYear;
            });

            const totalOrders = currentYearOrders.length;
            const previousTotal = previousYearOrders.length;
            const ordersGrowth = previousTotal > 0 ? 
                ((totalOrders - previousTotal) / previousTotal * 100).toFixed(1) : 0;

            const pendingOrders = orders.filter(order => order.status === 'pending').length;

            return {
                totalOrders,
                ordersGrowth: `${ordersGrowth}%`,
                pendingOrders
            };
        } catch (error) {
            console.error('Error fetching order metrics:', error);
            return {
                totalOrders: 0,
                ordersGrowth: '0%',
                pendingOrders: 0
            };
        }
    }

    /**
     * Get fallback transaction data when Appwrite fails
     * @returns {Object} Sample transaction data
     */
    getFallbackTransactionData() {
        const currentYear = new Date().getFullYear().toString();
        const previousYear = (parseInt(currentYear) - 1).toString();

        return {
            [currentYear]: [
                { month: 'Jan', amount: 360 },
                { month: 'Feb', amount: 400 },
                { month: 'Mar', amount: 480 },
                { month: 'Apr', amount: 380 },
                { month: 'May', amount: 300 },
                { month: 'Jun', amount: 380 },
                { month: 'Jul', amount: 400 },
                { month: 'Aug', amount: 640 },
                { month: 'Sep', amount: 440 },
                { month: 'Oct', amount: 420 },
                { month: 'Nov', amount: 340 },
                { month: 'Dec', amount: 460 }
            ],
            [previousYear]: [
                { month: 'Jan', amount: 300 },
                { month: 'Feb', amount: 350 },
                { month: 'Mar', amount: 420 },
                { month: 'Apr', amount: 320 },
                { month: 'May', amount: 280 },
                { month: 'Jun', amount: 350 },
                { month: 'Jul', amount: 380 },
                { month: 'Aug', amount: 500 },
                { month: 'Sep', amount: 400 },
                { month: 'Oct', amount: 380 },
                { month: 'Nov', amount: 300 },
                { month: 'Dec', amount: 420 }
            ]
        };
    }

    /**
     * Get fallback metrics when Appwrite fails
     * @returns {Object} Sample metrics
     */
    getFallbackMetrics() {
        return {
            totalRevenue: 'No record available',
            revenueGrowth: 'No record available',
            totalOrders: 'No record available',
            ordersGrowth: 'No record available',
            totalRequests: 'No record available',
            totalPayments: 'No record available',
            transactionData: {}
        };
    }
}