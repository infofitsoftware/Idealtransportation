import Image from 'next/image'

const timeline = [
  {
    name: 'Founded company',
    description: 'Started with a vision to revolutionize logistics',
    date: '2018',
  },
  {
    name: 'Regional expansion',
    description: 'Expanded operations to cover the entire West Coast',
    date: '2019',
  },
  {
    name: 'Nationwide coverage',
    description: 'Achieved full nationwide logistics network',
    date: '2020',
  },
  {
    name: 'Digital transformation',
    description: 'Launched our cutting-edge logistics platform',
    date: '2021',
  },
  {
    name: 'International operations',
    description: 'Started international shipping and logistics services',
    date: '2022',
  },
]

const team = [
  {
    name: 'Michael Chen',
    role: 'Chief Executive Officer',
    imageUrl: '/team/michael-chen.jpg',
  },
  {
    name: 'Sarah Johnson',
    role: 'Operations Director',
    imageUrl: '/team/sarah-johnson.jpg',
  },
  {
    name: 'David Martinez',
    role: 'Technology Lead',
    imageUrl: '/team/david-martinez.jpg',
  },
  {
    name: 'Emily Wong',
    role: 'Customer Relations Manager',
    imageUrl: '/team/emily-wong.jpg',
  },
]

export default function About() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">About Us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Our Journey in Transportation
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Since our founding in 2018, we've been dedicated to providing innovative logistics solutions
            that help businesses grow and succeed.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-2">
            {/* Company Timeline */}
            <div className="flex flex-col gap-y-8">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">Our Timeline</h3>
              <div className="flex flex-col gap-y-6">
                {timeline.map((item) => (
                  <div key={item.name} className="relative flex gap-x-4">
                    <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                      <div className="w-px bg-gray-200" />
                    </div>
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-600 ring-1 ring-primary-600" />
                    </div>
                    <div className="flex-auto">
                      <div className="flex justify-between gap-x-4">
                        <div className="py-0.5 text-sm font-semibold leading-5 text-gray-900">
                          {item.name}
                        </div>
                        <time className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                          {item.date}
                        </time>
                      </div>
                      <p className="text-sm leading-6 text-gray-500">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mission Statement */}
            <div className="flex flex-col gap-y-8">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">Our Mission</h3>
              <p className="text-lg text-gray-600">
                At Ideal Transportation Solutions, we're committed to revolutionizing the logistics
                industry through innovation, reliability, and customer-focused service. Our mission is
                to provide seamless, efficient, and sustainable transportation solutions that empower
                businesses to thrive in today's fast-paced global economy.
              </p>
              <p className="text-lg text-gray-600">
                We believe in building lasting partnerships with our clients, understanding their unique
                needs, and delivering customized solutions that drive their success. Our team of
                experienced professionals works tirelessly to ensure that every shipment is handled
                with the utmost care and precision.
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mx-auto mt-32 max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Team</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Meet the dedicated professionals who make our success possible.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4"
        >
          {team.map((person) => (
            <li key={person.name}>
              <Image
                className="aspect-[3/2] w-full rounded-2xl object-cover"
                src={person.imageUrl}
                alt=""
                width={300}
                height={200}
              />
              <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">{person.name}</h3>
              <p className="text-base leading-7 text-gray-600">{person.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 