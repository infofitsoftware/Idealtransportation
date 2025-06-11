import { TruckIcon, GlobeAltIcon, CubeIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

const services = [
  {
    name: 'Vehicle Transportation',
    description: 'Professional car shipping services across the country with real-time tracking and insurance coverage.',
    icon: TruckIcon,
  },
  {
    name: 'International Logistics',
    description: 'Global shipping solutions with customs clearance and documentation support.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Warehousing',
    description: 'Secure storage facilities with inventory management and distribution services.',
    icon: CubeIcon,
  },
  {
    name: 'Supply Chain Management',
    description: 'End-to-end supply chain solutions with advanced analytics and optimization.',
    icon: ClipboardDocumentCheckIcon,
  },
]

export default function Services() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Our Services</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Comprehensive Logistics Solutions
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We offer a wide range of transportation and logistics services to meet your business needs.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {services.map((service) => (
              <div key={service.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <service.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                  {service.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{service.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
} 