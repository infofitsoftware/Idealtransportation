import { api } from './auth'

export interface DailyExpenseData {
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

export const dailyExpenseService = {
  async createExpense(expenseData: DailyExpenseData) {
    const response = await api.post('/api/transactions/daily-expenses', expenseData)
    return response.data
  },

  async getExpenses() {
    const response = await api.get('/api/transactions/daily-expenses')
    return response.data
  },

  async getExpense(id: number) {
    const response = await api.get(`/api/transactions/daily-expenses/${id}`)
    return response.data
  }
} 