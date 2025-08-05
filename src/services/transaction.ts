import { api } from './auth';

// Updated interfaces to match new schema
export interface Transaction {
  id: number;
  date: string;
  work_order_no: string;
  collected_amount: number;
  due_amount: number;
  bol_id: number;
  pickup_location: string;
  dropoff_location: string;
  payment_type: string;
  comments?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  date: string;
  work_order_no: string;
  collected_amount: number;
  due_amount: number;
  bol_id: number;
  pickup_location: string;
  dropoff_location: string;
  payment_type: string;
  comments?: string;
}

// New interfaces for work order operations
export interface PendingWorkOrder {
  id: number;
  work_order_no: string;
  driver_name: string;
  date: string;
  total_amount: number;
  total_collected: number;
  due_amount: number;
}

export interface WorkOrderPaymentStatus {
  work_order_no: string;
  total_amount: number;
  total_collected: number;
  due_amount: number;
  is_fully_paid: boolean;
  payment_percentage: number;
}

export interface WorkOrderTransaction {
  id: number;
  date: string;
  collected_amount: number;
  due_amount: number;
  payment_type: string;
  comments?: string;
}

// BOL interfaces
export interface BOLWithPendingPayment {
  id: number;
  work_order_no: string;
  driver_name: string;
  date: string;
  total_amount: number;
  total_collected: number;
  due_amount: number;
}

export const transactionService = {
  // Existing transaction methods
  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const response = await api.post('/api/transactions', data);
    return response.data;
  },

  async getTransactions(): Promise<Transaction[]> {
    const response = await api.get('/api/transactions');
    return response.data;
  },

  async getTransaction(id: number): Promise<Transaction> {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },

  async updateTransaction(id: number, data: Partial<TransactionCreate>): Promise<Transaction> {
    const response = await api.put(`/api/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/api/transactions/${id}`);
  },

  // New work order methods
  async getPendingWorkOrders(): Promise<PendingWorkOrder[]> {
    const response = await api.get('/api/transactions/work-orders/pending');
    return response.data;
  },

  async getWorkOrderPaymentStatus(workOrderNo: string): Promise<WorkOrderPaymentStatus> {
    const response = await api.get(`/api/transactions/work-order/${workOrderNo}/status`);
    return response.data;
  },

  async getTransactionsByWorkOrder(workOrderNo: string): Promise<WorkOrderTransaction[]> {
    const response = await api.get(`/api/transactions/work-order/${workOrderNo}/transactions`);
    return response.data;
  }
};

// BOL service methods
export const bolService = {
  async getBOLsWithPendingPayments(): Promise<BOLWithPendingPayment[]> {
    const response = await api.get('/api/bol/pending-payments');
    return response.data;
  },

  async getWorkOrderPaymentStatus(workOrderNo: string): Promise<WorkOrderPaymentStatus> {
    const response = await api.get(`/api/bol/work-order/${workOrderNo}/payment-status`);
    return response.data;
  },

  async createBOL(bolData: any): Promise<any> {
    const response = await api.post('/api/bol/', bolData);
    return response.data;
  },

  async getBOLs(): Promise<any[]> {
    const response = await api.get('/api/bol/');
    return response.data;
  }
}; 