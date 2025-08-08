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
    console.log('[transactionService] POST', api.defaults.baseURL + '/transactions', data);
    const response = await api.post('/transactions', data);
    return response.data;
  },

  async getTransactions(): Promise<Transaction[]> {
    console.log('[transactionService] GET', api.defaults.baseURL + '/transactions');
    console.log('[transactionService] API Instance BaseURL:', api.defaults.baseURL);
    console.log('[transactionService] Protocol:', window.location.protocol);
    
    const response = await api.get('/transactions');
    return response.data;
  },

  async getTransaction(id: number): Promise<Transaction> {
    console.log('[transactionService] GET', api.defaults.baseURL + `/transactions/${id}`);
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async updateTransaction(id: number, data: Partial<TransactionCreate>): Promise<Transaction> {
    console.log('[transactionService] PUT', api.defaults.baseURL + `/transactions/${id}`, data);
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: number): Promise<void> {
    console.log('[transactionService] DELETE', api.defaults.baseURL + `/transactions/${id}`);
    await api.delete(`/transactions/${id}`);
  },

  // New work order methods
  async getPendingWorkOrders(): Promise<PendingWorkOrder[]> {
    console.log('[transactionService] GET', api.defaults.baseURL + '/transactions/work-orders/pending');
    const response = await api.get('/transactions/work-orders/pending');
    return response.data;
  },

  async getWorkOrderPaymentStatus(workOrderNo: string): Promise<WorkOrderPaymentStatus> {
    console.log('[transactionService] GET', api.defaults.baseURL + `/transactions/work-order/${workOrderNo}/status`);
    const response = await api.get(`/transactions/work-order/${workOrderNo}/status`);
    return response.data;
  },

  async getTransactionsByWorkOrder(workOrderNo: string): Promise<WorkOrderTransaction[]> {
    console.log('[transactionService] GET', api.defaults.baseURL + `/transactions/work-order/${workOrderNo}/transactions`);
    const response = await api.get(`/transactions/work-order/${workOrderNo}/transactions`);
    return response.data;
  }
};

// BOL service methods
export const bolService = {
  async getBOLsWithPendingPayments(): Promise<BOLWithPendingPayment[]> {
    console.log('[bolService] GET', api.defaults.baseURL + '/bol/pending-payments');
    const response = await api.get('/bol/pending-payments');
    return response.data;
  },

  async getWorkOrderPaymentStatus(workOrderNo: string): Promise<WorkOrderPaymentStatus> {
    console.log('[bolService] GET', api.defaults.baseURL + `/bol/work-order/${workOrderNo}/payment-status`);
    const response = await api.get(`/bol/work-order/${workOrderNo}/payment-status`);
    return response.data;
  },

  async createBOL(bolData: any): Promise<any> {
    console.log('[bolService] POST', api.defaults.baseURL + '/bol/', bolData);
    const response = await api.post('/bol/', bolData);
    return response.data;
  },

  async getBOLs(): Promise<any[]> {
    console.log('[bolService] GET', api.defaults.baseURL + '/bol/');
    const response = await api.get('/bol/');
    return response.data;
  }
}; 