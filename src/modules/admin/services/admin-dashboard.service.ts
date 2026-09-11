import { Order } from "../../orders/models/order.model";
import { User } from "../../users/models/user.model";
import { Retailer } from "../../retailers/models/retailer.model";
import { DeliveryPartner } from "../../delivery/models/delivery-partner.model";
import { OrderStatus, RetailerStatus } from "../../../common/constants/status.constants";

export class AdminDashboardService {
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = "dashboard";

  async getDashboardMetrics(): Promise<any> {
    return await this.calculateMetrics();
  }

  private async calculateMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(today);
    monthStart.setDate(monthStart.getDate() - 30);

    try {
      const [
        totalUsers, activeUsers, newUsersToday,
        totalRetailers, activeRetailers, pendingRetailers,
        totalDeliveryPartners, onlineDeliveryPartners,
        totalOrders, pendingOrders, completedOrders, cancelledOrders,
        totalRevenue, todayRevenue, weekRevenue, monthRevenue, averageOrderValue,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "ACTIVE" }),
        User.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),

        Retailer.countDocuments(),
        Retailer.countDocuments({ status: RetailerStatus.APPROVED }),
        Retailer.countDocuments({ status: RetailerStatus.PENDING }),

        DeliveryPartner.countDocuments(),
        DeliveryPartner.countDocuments({ availability: "ONLINE" }),

        Order.countDocuments(),
        Order.countDocuments({ status: OrderStatus.PLACED }),
        Order.countDocuments({ status: OrderStatus.DELIVERED }),
        Order.countDocuments({ status: OrderStatus.CANCELLED }),

        this.sumRevenue({ status: OrderStatus.DELIVERED }),
        this.sumRevenue({ status: OrderStatus.DELIVERED, createdAt: { $gte: today, $lte: todayEnd } }),
        this.sumRevenue({ status: OrderStatus.DELIVERED, createdAt: { $gte: weekStart, $lte: todayEnd } }),
        this.sumRevenue({ status: OrderStatus.DELIVERED, createdAt: { $gte: monthStart, $lte: todayEnd } }),
        this.avgOrderValue(),
      ]);

      return {
        metrics: {
          users: { total: totalUsers, active: activeUsers, newToday: newUsersToday, growth: 0 },
          retailers: {
            total: totalRetailers,
            active: activeRetailers,
            pending: pendingRetailers,
            approvalRate: totalRetailers > 0 ? (activeRetailers / totalRetailers) * 100 : 0,
          },
          deliveryPartners: {
            total: totalDeliveryPartners,
            active: totalDeliveryPartners,
            online: onlineDeliveryPartners,
            onlineRate: totalDeliveryPartners > 0 ? (onlineDeliveryPartners / totalDeliveryPartners) * 100 : 0,
          },
          orders: {
            total: totalOrders,
            pending: pendingOrders,
            processing: 0,
            completed: completedOrders,
            cancelled: cancelledOrders,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
          },
          revenue: {
            total: totalRevenue,
            today: todayRevenue,
            week: weekRevenue,
            month: monthRevenue,
            averageOrderValue,
          },
        },
        topRetailers: [],
        topProducts: [],
        orderTrends: [],
        zoneStats: [],
        timestamp: new Date().toISOString(),
      };
    } catch (e: any) {
      console.error("calculateMetrics failed:", e?.message || e);
      return {
        metrics: {
          users: { total: 0, active: 0, newToday: 0, growth: 0 },
          retailers: { total: 0, active: 0, pending: 0, approvalRate: 0 },
          deliveryPartners: { total: 0, active: 0, online: 0, onlineRate: 0 },
          orders: { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0, completionRate: 0 },
          revenue: { total: 0, today: 0, week: 0, month: 0, averageOrderValue: 0 },
        },
        topRetailers: [],
        topProducts: [],
        orderTrends: [],
        zoneStats: [],
        timestamp: new Date().toISOString(),
        fallback: true,
      };
    }
  }

  private async sumRevenue(match: any): Promise<number> {
    try {
      const r = await Order.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);
      return r.length ? r[0].total : 0;
    } catch { return 0; }
  }

  private async avgOrderValue(): Promise<number> {
    try {
      const r = await Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $group: { _id: null, avg: { $avg: "$total" } } },
      ]);
      return r.length ? Math.round(r[0].avg) : 0;
    } catch { return 0; }
  }

  async getRealtimeStats(): Promise<any> {
    return { recentOrders: 0, recentUsers: 0, activeOrders: 0, timestamp: new Date().toISOString() };
  }

  async getActivityLogs(filters: any): Promise<any> {
    return { logs: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
  }

  async logActivity(data: any): Promise<void> { /* no-op */ }

  async getDashboardAnalytics(date?: Date): Promise<any> {
    return { date: (date || new Date()).toISOString(), metrics: {} };
  }

  async getChartData(type: string, period: string): Promise<any> {
    return { type, period, data: [], startDate: new Date().toISOString() };
  }
}
