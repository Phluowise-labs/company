// =============================
// Appwrite SDK
// =============================
import {
  Client,
  Account,
  Databases,
  Query,
} from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

// =============================
// Appwrite configuration
// =============================
export const APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT = "68b17582003582da69c8";

// Initialize client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT);

// Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const Appwrite = { Query }; // for queries like Appwrite.Query.equal(...)

// =============================
// Database configuration
// =============================
export const DB_ID = "68b1b7590035346a3be9"; // phluowisez_db
export const COMPANY_COLL = "company_tb";
export const BRANCH_COLL = "branches";
// Additional collections for metrics
export const ORDERS_COLL = "orders"; // statuses: accepted, pending, denied, cancelled_by_customer
export const ORDER_ITEMS_COLL = "order_items"; // junction table for orders and products
export const DELIVERIES_COLL = "deliveries"; // delivery records with timestamps and outcomes
export const TRANSACTIONS_COLL = "transactions"; // financial transactions
export const RATINGS_COLL = "ratings"; // customer feedback per delivery/order
export const DRIVERS_COLL = "drivers"; // driver profiles and presence status
export const CUSTOMERS_COLL = "customers"; // customer profiles and branch/company linkage
export const PRODUCTS_COLL = "product"; // product catalog

// =============================
// Utility Functions
// =============================
// Function to check if company_id equals branch_id (company admin branch)
export function isCompanyAdminBranch(branch, companyId) {
  return (
    branch.company_id === branch.branch_id && branch.company_id === companyId
  );
}
