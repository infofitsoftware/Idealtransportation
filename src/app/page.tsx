import Link from 'next/link'
import { TruckIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
            <h1 className="mt-10 max-w-lg text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your Trusted Partner in Transportation Solutions
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Delivering excellence through innovative logistics solutions, reliable service, and cutting-edge technology.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/dashboard"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Start Using the App
              </Link>
              <Link href="/contact" className="text-sm font-semibold leading-6 text-gray-900">
                Contact Us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Efficient Solutions</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your logistics
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </main>
  )
}

const features = [
  {
    name: 'Real-time Tracking',
    description: 'Track your shipments in real-time with our advanced GPS tracking system.',
    icon: TruckIcon,
  },
  {
    name: 'On-time Delivery',
    description: 'We pride ourselves on maintaining strict delivery schedules.',
    icon: ClockIcon,
  },
  {
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics to optimize your logistics operations.',
    icon: ChartBarIcon,
  },
] 