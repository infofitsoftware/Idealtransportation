import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

export default function Contact() {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Get in touch</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 text-base leading-7 sm:grid-cols-2 sm:gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          <div>
            <h3 className="border-l border-primary-600 pl-6 font-semibold text-gray-900">Visit us</h3>
            <address className="border-l border-gray-200 pl-6 pt-2 not-italic text-gray-600">
              123 Transport Street
              <br />
              Suite 100
              <br />
              Los Angeles, CA 90012
            </address>
          </div>
          <div>
            <h3 className="border-l border-primary-600 pl-6 font-semibold text-gray-900">Call us</h3>
            <div className="border-l border-gray-200 pl-6 pt-2 space-y-1">
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href="tel:+1 (555) 234-5678" className="hover:text-primary-600">+1 (555) 234-5678</a>
              </div>
            </div>
          </div>
          <div>
            <h3 className="border-l border-primary-600 pl-6 font-semibold text-gray-900">Email us</h3>
            <div className="border-l border-gray-200 pl-6 pt-2 space-y-1">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                <a href="mailto:contact@idealtransport.com" className="hover:text-primary-600">
                  contact@idealtransport.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <form action="#" method="POST" className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2.5">
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="name"
                  className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900">
                Email
              </label>
              <div className="mt-2.5">
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-semibold leading-6 text-gray-900">
                Subject
              </label>
              <div className="mt-2.5">
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                Message
              </label>
              <div className="mt-2.5">
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="block w-full rounded-md bg-primary-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 