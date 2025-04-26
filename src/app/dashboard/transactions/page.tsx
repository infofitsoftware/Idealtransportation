import { useState } from 'react'

interface Transaction {
  date: string
  carYear: string
  carMake: string
  carModel: string
  vinLast6: string
  numCompanies: string
  pickupLocation: string
  dropoffLocation: string
  paymentType: 'Cash' | 'Check' | 'Zelle'
  comments: string
}

const paymentTypes = ['Cash', 'Check', 'Zelle'] as const

export default function TransactionForm() {
  const [formData, setFormData] = useState<Transaction>({
    date: new Date().toISOString().split('T')[0],
    carYear: '',
    carMake: '',
    carModel: '',
    vinLast6: '',
    numCompanies: '',
    pickupLocation: '',
    dropoffLocation: '',
    paymentType: 'Cash',
    comments: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission
    console.log('Form submitted:', formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900">Daily Transaction Form</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter the details for a new transportation transaction.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-6">
            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
                Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>
            </div>

            {/* Car Info */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="carYear" className="block text-sm font-medium leading-6 text-gray-900">
                  Car Year
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="carYear"
                    id="carYear"
                    value={formData.carYear}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="carMake" className="block text-sm font-medium leading-6 text-gray-900">
                  Car Make
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="carMake"
                    id="carMake"
                    value={formData.carMake}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="carModel" className="block text-sm font-medium leading-6 text-gray-900">
                  Car Model
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="carModel"
                    id="carModel"
                    value={formData.carModel}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vinLast6" className="block text-sm font-medium leading-6 text-gray-900">
                  Last 6 VIN Digits
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="vinLast6"
                    id="vinLast6"
                    value={formData.vinLast6}
                    onChange={handleChange}
                    maxLength={6}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Number of Companies */}
            <div>
              <label htmlFor="numCompanies" className="block text-sm font-medium leading-6 text-gray-900">
                Number of Companies
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="numCompanies"
                  id="numCompanies"
                  value={formData.numCompanies}
                  onChange={handleChange}
                  min="1"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  required
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pickupLocation" className="block text-sm font-medium leading-6 text-gray-900">
                  Pickup Location
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="pickupLocation"
                    id="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dropoffLocation" className="block text-sm font-medium leading-6 text-gray-900">
                  Drop-off Location
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="dropoffLocation"
                    id="dropoffLocation"
                    value={formData.dropoffLocation}
                    onChange={handleChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label htmlFor="paymentType" className="block text-sm font-medium leading-6 text-gray-900">
                Payment Type
              </label>
              <div className="mt-2">
                <select
                  id="paymentType"
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  required
                >
                  {paymentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-sm font-medium leading-6 text-gray-900">
                Comments
              </label>
              <div className="mt-2">
                <textarea
                  id="comments"
                  name="comments"
                  rows={3}
                  value={formData.comments}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
              onClick={() => setFormData({
                date: new Date().toISOString().split('T')[0],
                carYear: '',
                carMake: '',
                carModel: '',
                vinLast6: '',
                numCompanies: '',
                pickupLocation: '',
                dropoffLocation: '',
                paymentType: 'Cash',
                comments: '',
              })}
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 