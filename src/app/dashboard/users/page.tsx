'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { authService } from '@/services/auth'
import { useAccessControl } from '@/hooks/useAccessControl'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  full_name: string | null
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string | null
}

export default function UserManagementPage() {
  const router = useRouter()
  const { isSuperuser, loading: accessLoading } = useAccessControl()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    is_superuser: false,
    is_active: true
  })

  useEffect(() => {
    if (!accessLoading) {
      if (!isSuperuser) {
        toast.error('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }
      fetchUsers()
    }
  }, [isSuperuser, accessLoading, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await authService.getUsers()
      setUsers(data)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.detail || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name || null,
          is_superuser: formData.is_superuser,
          is_active: formData.is_active
        }
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password
        }
        await authService.updateUser(editingUser.id, updateData)
        toast.success('User updated successfully!')
      } else {
        // Create new user
        await authService.createUser({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name || undefined,
          is_superuser: formData.is_superuser,
          is_active: formData.is_active
        })
        toast.success('User created successfully!')
      }
      resetForm()
      fetchUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.response?.data?.detail || 'Failed to save user')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      full_name: user.full_name || '',
      is_superuser: user.is_superuser,
      is_active: user.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      await authService.deleteUser(userId)
      toast.success('User deleted successfully!')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.response?.data?.detail || 'Failed to delete user')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      is_superuser: false,
      is_active: true
    })
    setEditingUser(null)
    setShowForm(false)
  }

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSuperuser) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
          User Management
        </h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New User
        </button>
      </div>

      {/* Create/Edit User Form */}
      {showForm && (
        <div className="mb-6 bg-white shadow-xl rounded-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  required={!editingUser}
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_superuser"
                    checked={formData.is_superuser}
                    onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_superuser" className="ml-2 block text-sm text-gray-700">
                    Admin Role (Superuser)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active User
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.full_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_superuser
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.is_superuser ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit user"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

