import { api } from './auth'

export interface DailyExpenseData {
  id: number
  date: string
  diesel_amount: number
  diesel_location: string
  def_amount: number
  def_location: string
  other_expense_description?: string
  other_expense_amount?: number
  other_expense_location?: string
  total: number
  user_id: number
  created_at: string
  updated_at: string
}

export interface DailyExpenseCreate {
  date: string
  diesel_amount: number
  diesel_location: string
  def_amount: number
  def_location: string
  other_expense_description?: string
  other_expense_amount?: number
  other_expense_location?: string
  total: number
}

function formatError(error: any): string {
  if (error.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map((err: any) => err.msg).join(', ')
    }
    return error.response.data.detail
  }
  return error.message || 'An error occurred'
}

export const dailyExpenseService = {
  async createExpense(data: DailyExpenseCreate): Promise<DailyExpenseData> {
    try {
      // Convert all numeric fields to numbers
      const processedData = {
        ...data,
        diesel_amount: Number(data.diesel_amount),
        def_amount: Number(data.def_amount),
        other_expense_amount: data.other_expense_amount ? Number(data.other_expense_amount) : undefined,
        total: Number(data.total)
      }
      
      const response = await api.post('/api/transactions/daily-expenses', processedData)
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
    console.log('Making API call to /api/transactions/daily-expenses')
    try {
      // Get the token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Log the request configuration
      const config = {
        url: '/api/transactions/daily-expenses',
        method: 'get',
        headers: {
          ...api.defaults.headers,
          Authorization: `Bearer ${token}`
        }
      }
      console.log('Request config:', config)
      
      const response = await api.get('/api/transactions/daily-expenses', config)
      console.log('API Response:', response)
      return response.data
    } catch (error: any) {
      console.error('API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        headers: error.response?.headers,
        config: error.config,
        request: error.request
      })
      if (error.response?.status === 422) {
        console.error('Validation Error Details:', {
          detail: error.response.data.detail,
          fullError: error.response.data
        })
      }
      throw error
    }
  },

  async getExpense(id: number): Promise<DailyExpenseData> {
    try {
      const response = await api.get(`/api/transactions/daily-expenses/${id}`)
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
      // Convert all numeric fields to numbers if they exist
      const processedData = {
        ...data,
        diesel_amount: data.diesel_amount ? Number(data.diesel_amount) : undefined,
        def_amount: data.def_amount ? Number(data.def_amount) : undefined,
        other_expense_amount: data.other_expense_amount ? Number(data.other_expense_amount) : undefined,
        total: data.total ? Number(data.total) : undefined
      }
      
      const response = await api.put(`/api/transactions/daily-expenses/${id}`, processedData)
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
      await api.delete(`/api/transactions/daily-expenses/${id}`)
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