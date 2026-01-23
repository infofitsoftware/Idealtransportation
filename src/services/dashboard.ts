import { api } from './auth';

export interface DashboardStats {
  total_bols: number;
  total_revenue: number;
  total_collected: number;
  total_pending: number;
  active_drivers?: number; // Admin only
  payment_breakdown: {
    fully_paid: number;
    partially_paid: number;
    pending_payment: number;
  };
}

export interface RecentBOL {
  id: number;
  work_order_no: string | null;
  driver_name: string;
  date: string | null;
  total_amount: number;
  collected: number;
  due: number;
  status: 'paid' | 'partial' | 'pending';
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface RecentActivity {
  id: number;
  work_order_no: string | null;
  driver_name: string;
  date: string | null;
  created_at: string | null;
}

export interface DashboardData {
  role: 'admin' | 'driver';
  stats: DashboardStats;
  recent_bols: RecentBOL[];
  monthly_revenue?: MonthlyRevenue[]; // Admin only
  recent_activity: RecentActivity[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardData> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
    }
  },
};
