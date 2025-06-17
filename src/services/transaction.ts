import { api } from './auth';

export interface Transaction {
  id: number;
  date: string;
  car_year: string;
  car_make: string;
  car_model: string;
  car_vin: string;
  pickup_location: string;
  dropoff_location: string;
  payment_type: string;
  amount: number;
  comments?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  date: string;
  car_year: string;
  car_make: string;
  car_model: string;
  car_vin: string;
  pickup_location: string;
  dropoff_location: string;
  payment_type: string;
  amount: number;
  comments?: string;
}

export const transactionService = {
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
  }
}; 