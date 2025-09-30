// Import Appwrite configuration
import {
  databases,
  DB_ID,
  TRANSACTIONS_COLL,
  CUSTOMERS_COLL,
  Appwrite,
} from "./config.js";

/**
 * Transaction Manager for handling Appwrite transactions data
 */
class TransactionManager {
  constructor() {
    this.transactions = [];
    this.customers = new Map(); // Cache for customer data
  }

  /**
   * Get current user's company and branch context
   */
  getCurrentContext() {
    // Check for authentication using the correct localStorage keys from the auth system
    let companyId = localStorage.getItem("companyId"); // From authManager.js

    // If not found, try the company-auth.js system
    if (!companyId) {
      const loggedInCompany = localStorage.getItem("loggedInCompany");
      if (loggedInCompany) {
        try {
          const companyData = JSON.parse(loggedInCompany);
          companyId = companyData.company_id || companyData.id;
        } catch (e) {
          console.error("Error parsing loggedInCompany:", e);
        }
      }
    }

    // Check if user is authenticated
    const authToken = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");

    if (!companyId && !authToken && !user) {
      throw new Error("Company ID not found. Please ensure you are logged in.");
    }

    // If still no companyId, try to get it from user data
    if (!companyId && user) {
      try {
        const userData = JSON.parse(user);
        companyId = userData.$id; // Appwrite user ID can be used as company ID
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    if (!companyId) {
      throw new Error("Company ID not found. Please ensure you are logged in.");
    }

    // Get branch ID (optional)
    const branchId =
      localStorage.getItem("branchId") || localStorage.getItem("branch_id");

    return { companyId, branchId };
  }

  /**
   * Fetch customer data for a given customer ID
   */
  async fetchCustomer(customerId) {
    if (this.customers.has(customerId)) {
      return this.customers.get(customerId);
    }

    try {
      const customer = await databases.getDocument(
        DB_ID,
        CUSTOMERS_COLL,
        customerId
      );
      this.customers.set(customerId, customer);
      return customer;
    } catch (error) {
      console.warn(`Could not fetch customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch transactions from Appwrite
   */
  async fetchTransactions() {
    try {
      const { companyId, branchId } = this.getCurrentContext();

      if (!companyId) {
        throw new Error(
          "Company ID not found. Please ensure you are logged in."
        );
      }

      // Build query filters
      const queries = [
        Appwrite.Query.equal("company_id", companyId),
        Appwrite.Query.orderDesc("created_at"),
        Appwrite.Query.limit(100), // Limit to recent 100 transactions
      ];

      // If branch context is provided, filter by branch
      if (branchId && branchId !== companyId) {
        queries.push(Appwrite.Query.equal("branch_id", branchId));
      }

      const response = await databases.listDocuments(
        DB_ID,
        TRANSACTIONS_COLL,
        queries
      );

      // Transform Appwrite data to match the expected format
      const formattedTransactions = await Promise.all(
        response.documents.map(async (doc) => {
          // Try to get customer info if order_id exists
          let customerName = "N/A";
          let customerImage = "";

          if (doc.order_id) {
            try {
              // First get the order to find customer_id
              const orderResponse = await databases.listDocuments(
                DB_ID,
                "orders",
                [Appwrite.Query.equal("order_id", doc.order_id)]
              );

              if (orderResponse.documents.length > 0) {
                const order = orderResponse.documents[0];
                if (order.customer_id) {
                  const customer = await this.fetchCustomer(order.customer_id);
                  if (customer) {
                    customerName = customer.full_name || "N/A";
                    customerImage = customer.profile_image || "";
                  }
                }
              }
            } catch (error) {
              console.warn(
                "Could not fetch customer info for transaction:",
                doc.txn_id,
                error
              );
            }
          }

          // Format date and time
          const createdAt = new Date(doc.created_at || doc.$createdAt);
          const date = createdAt.toISOString().split("T")[0]; // YYYY-MM-DD format
          const time = createdAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          // Map status
          let status = "Pending";
          if (doc.status === "succeeded") {
            status = "Payment Successful";
          } else if (doc.status === "failed") {
            status = "Payment Failed";
          }

          // Format amounts
          const amountReceived = (doc.amount / 100).toFixed(2); // Convert from cents
          const amountPhluowise = doc.amountPhluowise
            ? (doc.amountPhluowise / 100).toFixed(2)
            : "0.00";

          return {
            id: doc.txn_id || doc.$id,
            image: customerImage || "../images/user.png",
            name: customerName,
            location: "N/A", // Not available in Appwrite schema
            status: status,
            time: time,
            date: date,
            amountReceived: amountReceived,
            amountPhluowise: amountPhluowise,
            paymentMethod: doc.paymentMethod || "N/A",
            currency: doc.currency || "GHS",
          };
        })
      );

      // Store transactions globally for other functions to access
      window.allTransactions = formattedTransactions;

      // Store transactions for later use
      this.transactions = formattedTransactions;

      return this.transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  /**
   * Get transactions summary for footer
   */
  getTransactionsSummary(filterDate = null) {
    let filteredTransactions = this.transactions;

    if (filterDate) {
      filteredTransactions = this.transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        const targetDate = new Date(filterDate);
        return transactionDate.toDateString() === targetDate.toDateString();
      });
    }

    const totalReceived = filteredTransactions.reduce((sum, transaction) => {
      return sum + parseFloat(transaction.amountReceived || 0);
    }, 0);

    const totalPhluowise = filteredTransactions.reduce((sum, transaction) => {
      return sum + parseFloat(transaction.amountPhluowise || 0);
    }, 0);

    return {
      totalReceived: totalReceived.toFixed(2),
      totalPhluowise: totalPhluowise.toFixed(2),
      count: filteredTransactions.length,
      currency: filteredTransactions[0]?.currency || "GHS",
    };
  }

  /**
   * Filter transactions by search term
   */
  filterTransactions(searchTerm) {
    if (!searchTerm) return this.transactions;

    const term = searchTerm.toLowerCase();
    return this.transactions.filter((transaction) => {
      return Object.values(transaction).some((value) =>
        String(value).toLowerCase().includes(term)
      );
    });
  }

  /**
   * Get today's transactions
   */
  getTodaysTransactions() {
    const today = new Date();
    return this.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.toDateString() === today.toDateString();
    });
  }
}

// Export the TransactionManager class
export default TransactionManager;
