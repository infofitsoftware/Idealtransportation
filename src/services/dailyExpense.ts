import { api } from './auth'

export interface DailyExpenseEntryData {
  id?: number
  expense_type: string
  sub_type?: string | null
  amount: number
  location: string
  payment_mode: string
  receipt_url?: string | null
  remarks?: string | null
}

export interface DailyExpenseData {
  id: number
  date: string
  vehicle_number?: string | null
  total: number
  user_id: number
  driver_name?: string
  entries: DailyExpenseEntryData[]
  created_at?: string
  updated_at?: string
}

export interface DailyExpenseCreate {
  date: string
  vehicle_number?: string | null
  entries: DailyExpenseEntryData[]
}

function formatError(error: any): string {
  if (error.response?.data?.detail) {
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((e: any) => e.msg || e.message).join(', ')
    }
  }
  return error.message || 'An error occurred'
}

export const dailyExpenseService = {
  async createExpense(data: DailyExpenseCreate): Promise<DailyExpenseData> {
    try {
      const response = await api.post('/transactions/daily-expenses/', data)
      return response.data
    } catch (error: any) {
      console.error('Error creating daily expense:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(formatError(error))
    }
  },

  async getExpenses(): Promise<DailyExpenseData[]> {
    console.log('Making API call to /transactions/daily-expenses/')
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
      
      const response = await api.get('/transactions/daily-expenses/', config)
      console.log('API Response:', response)
      return response.data
    } catch (error: any) {
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })
      throw error
    }
  },

  async getExpense(id: number): Promise<DailyExpenseData> {
    try {
      const response = await api.get(`/transactions/daily-expenses/${id}/`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching daily expense:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(formatError(error))
    }
  },

  async updateExpense(id: number, data: Partial<DailyExpenseCreate>): Promise<DailyExpenseData> {
    try {
      const response = await api.put(`/transactions/daily-expenses/${id}/`, data)
      return response.data
    } catch (error: any) {
      console.error('Error updating daily expense:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(formatError(error))
    }
  },

  async deleteExpense(id: number): Promise<void> {
    try {
      await api.delete(`/transactions/daily-expenses/${id}/`)
    } catch (error: any) {
      console.error('Error deleting daily expense:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(formatError(error))
    }
  }
}
