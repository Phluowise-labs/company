// Metrics service: fetches and aggregates data from Appwrite for dashboards
import { databases, DB_ID, Appwrite, ORDERS_COLL, DELIVERIES_COLL, TRANSACTIONS_COLL, RATINGS_COLL, DRIVERS_COLL, CUSTOMERS_COLL } from "./config.js";

export class MetricsService {
  static async fetchAdminMetrics(companyId) {
    const [orders, deliveries, transactions, ratings, drivers, customers] = await Promise.all([
      this.safeList(DB_ID, ORDERS_COLL, [Appwrite.Query.equal('company_id', companyId)]),
      this.safeList(DB_ID, DELIVERIES_COLL, [Appwrite.Query.equal('company_id', companyId)]),
      this.safeList(DB_ID, TRANSACTIONS_COLL, [Appwrite.Query.equal('company_id', companyId)]),
      this.safeList(DB_ID, RATINGS_COLL, [Appwrite.Query.equal('company_id', companyId)]),
      this.safeList(DB_ID, DRIVERS_COLL, [Appwrite.Query.equal('company_id', companyId)]),
      this.safeList(DB_ID, CUSTOMERS_COLL, [Appwrite.Query.equal('company_id', companyId)])
    ]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayDeliveries = deliveries.documents.filter(d => new Date(d.completed_at || d.created_at) >= startOfDay).length;
    const activeOrders = orders.documents.filter(o => ['accepted','pending'].includes((o.status||'').toLowerCase())).length;
    const pendingPickups = orders.documents.filter(o => (o.status||'').toLowerCase() === 'pending').length;
    const avgRating = this.average(ratings.documents.map(r => Number(r.stars || r.rating) || 0));
    const driversByBranch = this.countBy(drivers.documents, d => d.branch_id || 'unknown');
    const customersByBranch = this.countBy(customers.documents, c => c.branch_id || 'unknown');

    return {
      kpis: {
        deliveriesToday: todayDeliveries,
        activeOrders,
        pendingPickups,
        customerRating: Number(avgRating.toFixed(1))
      },
      charts: {
        deliveryPerformance: this.aggregateByDayOfWeek(deliveries.documents, (d) => d.completed_at || d.created_at),
        branchPerformance: this.aggregateShares(driversByBranch),
        customersPerBranch: this.labelsAndValues(customersByBranch),
        branchStatus: this.aggregateDriverStatus(drivers.documents),
        transactionsSummary: this.aggregateTransactionsByRange(transactions.documents),
        driversPerBranch: this.labelsAndValues(driversByBranch)
      }
    };
  }

  static async fetchBranchMetrics(companyId, branchId) {
    const filter = [Appwrite.Query.equal('company_id', companyId), Appwrite.Query.equal('branch_id', branchId)];
    const [orders, deliveries, transactions, ratings, drivers] = await Promise.all([
      this.safeList(DB_ID, ORDERS_COLL, filter),
      this.safeList(DB_ID, DELIVERIES_COLL, filter),
      this.safeList(DB_ID, TRANSACTIONS_COLL, filter),
      this.safeList(DB_ID, RATINGS_COLL, filter),
      this.safeList(DB_ID, DRIVERS_COLL, filter)
    ]);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayDeliveries = deliveries.documents.filter(d => new Date(d.completed_at || d.created_at) >= startOfDay).length;
    const activeOrders = orders.documents.filter(o => ['accepted','pending'].includes((o.status||'').toLowerCase())).length;
    const pendingPickups = orders.documents.filter(o => (o.status||'').toLowerCase() === 'pending').length;
    const avgRating = this.average(ratings.documents.map(r => Number(r.stars || r.rating) || 0));
    const onlineDrivers = drivers.documents.filter(d => (d.status||'').toLowerCase() === 'online').length;
    const idleDrivers = drivers.documents.filter(d => (d.status||'').toLowerCase() === 'idle').length;

    return {
      kpis: {
        deliveriesToday: todayDeliveries,
        activeOrders,
        pendingPickups,
        customerRating: Number(avgRating.toFixed(1)),
        onlineDrivers,
        idleDrivers
      },
      charts: {
        branchOperations: this.aggregateByHour(deliveries.documents, (d) => d.completed_at || d.created_at),
        transactionsSummary: this.aggregateTransactionsByRange(transactions.documents)
      }
    };
  }

  // Helpers
  static async safeList(db, coll, queries) {
    try { return await databases.listDocuments(db, coll, queries); } catch (e) { return { documents: [], total: 0 }; }
  }

  static average(nums) {
    const arr = nums.filter(n => Number.isFinite(n));
    if (!arr.length) return 0;
    return arr.reduce((a,b)=>a+b,0)/arr.length;
  }

  static countBy(items, keyFn) {
    return items.reduce((acc, it) => {
      const k = keyFn(it);
      acc[k] = (acc[k]||0)+1;
      return acc;
    }, {});
  }

  static labelsAndValues(mapObj) {
    const labels = Object.keys(mapObj);
    const values = labels.map(l => mapObj[l]);
    return { labels, values };
  }

  static aggregateByDayOfWeek(items, dateAccessor) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const counts = [0,0,0,0,0,0,0];
    items.forEach(it => {
      const dt = new Date(dateAccessor(it));
      if (isNaN(dt)) return;
      const idx = (dt.getDay()+6)%7; // Mon=0
      counts[idx]++;
    });
    return { labels: days, values: counts };
  }

  static aggregateByHour(items, dateAccessor) {
    const labels = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM'];
    const counts = new Array(labels.length).fill(0);
    items.forEach(it => {
      const dt = new Date(dateAccessor(it));
      if (isNaN(dt)) return;
      const h = dt.getHours();
      const map = {8:0,9:1,10:2,11:3,12:4,13:5,14:6,15:7,16:8,17:9,18:10,19:11};
      if (h in map) counts[map[h]]++;
    });
    return { labels, values: counts };
  }

  static aggregateShares(mapObj) {
    const labels = Object.keys(mapObj);
    const total = Object.values(mapObj).reduce((a,b)=>a+b,0) || 1;
    const values = labels.map(l => Math.round((mapObj[l]/total)*100));
    return { labels, values };
  }

  static aggregateDriverStatus(drivers) {
    const statusCounts = this.countBy(drivers, d => (d.status||'offline').toLowerCase());
    const labels = ['online','idle','offline'];
    const values = labels.map(s => statusCounts[s]||0);
    return { labels: ['Online','Idle','Offline'], values };
  }

  static aggregateTransactionsByRange(transactions) {
    // Simple bucketing for demo; replace with server-side aggregation if needed
    const toAmount = (t) => Number(t.amount) || 0;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = { labels:['12am','3am','6am','9am','12pm','3pm','6pm','9pm'], values:new Array(8).fill(0) };
    const week = { labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], values:new Array(7).fill(0) };
    const month = { labels:['W1','W2','W3','W4'], values:new Array(4).fill(0) };
    const year = { labels:['Q1','Q2','Q3','Q4'], values:new Array(4).fill(0) };

    transactions.forEach(t => {
      const dt = new Date(t.created_at || t.timestamp || t.$createdAt);
      if (isNaN(dt)) return;
      // day 3-hour buckets
      const hoursSinceStart = (dt - startOfDay) / 36e5;
      if (hoursSinceStart >= 0 && hoursSinceStart < 24) {
        const idx = Math.min(7, Math.floor(hoursSinceStart/3));
        day.values[idx] += toAmount(t);
      }
      // week by weekday
      const wd = (dt.getDay()+6)%7; week.values[wd] += toAmount(t);
      // month by week number (approx 7-day chunks)
      const dayOfMonth = dt.getDate(); const widx = Math.min(3, Math.floor((dayOfMonth-1)/7)); month.values[widx] += toAmount(t);
      // year by quarter
      const q = Math.floor(dt.getMonth()/3); year.values[q] += toAmount(t);
    });

    return { day, week, month, year };
  }
}


