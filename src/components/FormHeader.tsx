import Image from 'next/image'

export default function FormHeader() {
  return (
    <div className="bg-white border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="/logo.jpeg"
            alt="Ideal Transportation Solutions Logo"
            width={240}
            height={80}
            className="h-20 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ideal Transportation Solutions Private Limited</h1>
            <p className="text-sm text-gray-600">16 Palmero Way, Manvel, Texas 77578</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Document Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
} 