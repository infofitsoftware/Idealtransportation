import Link from 'next/link'
import Image from 'next/image'
import { 
  TruckIcon, 
  ClockIcon, 
  ChartBarIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  UserGroupIcon,
  StarIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes carousel-0 {
            0%, 25% { opacity: 1; }
            33%, 100% { opacity: 0; }
          }
          @keyframes carousel-1 {
            0%, 25% { opacity: 0; }
            33%, 50% { opacity: 1; }
            58%, 100% { opacity: 0; }
          }
          @keyframes carousel-2 {
            0%, 50% { opacity: 0; }
            58%, 75% { opacity: 1; }
            83%, 100% { opacity: 0; }
          }
          @keyframes carousel-3 {
            0%, 75% { opacity: 0; }
            83%, 100% { opacity: 1; }
          }
        `
      }} />
      <main className="min-h-screen">
      {/* Hero Section with Carousel */}
      <section className="relative h-[600px]">
        {/* Carousel */}
        <div className="absolute inset-0 overflow-hidden">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === 0 ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                animation: `carousel-${index} 12s infinite`
              }}
            >
                             <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-4 sm:space-y-6 lg:space-y-8 text-white text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-tight drop-shadow-2xl">
                  Your Trusted Partner in 
                  <span className="text-primary-300 drop-shadow-2xl"> Transportation Solutions</span>
                </h1>
                <p className="text-sm sm:text-lg md:text-xl text-white leading-relaxed drop-shadow-lg font-medium">
                  Delivering excellence through innovative logistics solutions, reliable service, 
                  and cutting-edge technology. We connect businesses with seamless transportation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm md:text-base"
                  >
                    Start Using the App
                    <ArrowRightIcon className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </Link>
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold rounded-lg transition-colors text-xs sm:text-sm md:text-base"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-2xl">
                      <TruckIcon className="h-12 w-12 text-primary-300 mb-4 drop-shadow-lg" />
                      <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">Fleet Management</h3>
                      <p className="text-white drop-shadow-md">Advanced tracking and management solutions</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-2xl">
                      <ClockIcon className="h-12 w-12 text-primary-300 mb-4 drop-shadow-lg" />
                      <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">24/7 Support</h3>
                      <p className="text-white drop-shadow-md">Round-the-clock customer service</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-2xl">
                      <ChartBarIcon className="h-12 w-12 text-primary-300 mb-4 drop-shadow-lg" />
                      <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">Analytics</h3>
                      <p className="text-white drop-shadow-md">Comprehensive reporting and insights</p>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-2xl">
                      <ShieldCheckIcon className="h-12 w-12 text-primary-300 mb-4 drop-shadow-lg" />
                      <h3 className="text-lg font-semibold mb-2 text-white drop-shadow-lg">Secure Transport</h3>
                      <p className="text-white drop-shadow-md">Safe and reliable delivery services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Feature Cards */}
            <div className="lg:hidden mt-4 sm:mt-6 lg:mt-8">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20 shadow-2xl">
                  <TruckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-300 mb-1 sm:mb-2 drop-shadow-lg" />
                  <h3 className="text-xs sm:text-sm font-semibold mb-1 text-white drop-shadow-lg">Fleet Management</h3>
                  <p className="text-xs text-white drop-shadow-md leading-tight">Advanced tracking solutions</p>
                </div>
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20 shadow-2xl">
                  <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-300 mb-1 sm:mb-2 drop-shadow-lg" />
                  <h3 className="text-xs sm:text-sm font-semibold mb-1 text-white drop-shadow-lg">24/7 Support</h3>
                  <p className="text-xs text-white drop-shadow-md leading-tight">Round-the-clock service</p>
                </div>
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20 shadow-2xl">
                  <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-300 mb-1 sm:mb-2 drop-shadow-lg" />
                  <h3 className="text-xs sm:text-sm font-semibold mb-1 text-white drop-shadow-lg">Analytics</h3>
                  <p className="text-xs text-white drop-shadow-md leading-tight">Comprehensive insights</p>
                </div>
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 sm:p-4 border border-white/20 shadow-2xl">
                  <ShieldCheckIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-300 mb-1 sm:mb-2 drop-shadow-lg" />
                  <h3 className="text-xs sm:text-sm font-semibold mb-1 text-white drop-shadow-lg">Secure Transport</h3>
                  <p className="text-xs text-white drop-shadow-md leading-tight">Safe delivery services</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-3">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-colors"
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
                About Ideal Transportation
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Leading the Way in Transportation Excellence
              </h2>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                With years of experience in the transportation industry, Ideal Transportation Solutions 
                has established itself as a trusted partner for businesses across Texas and beyond. 
                Our commitment to quality, reliability, and innovation sets us apart.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">500+</div>
                  <div className="text-sm sm:text-base text-gray-600">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">10K+</div>
                  <div className="text-sm sm:text-base text-gray-600">Successful Deliveries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">24/7</div>
                  <div className="text-sm sm:text-base text-gray-600">Support Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-600">99%</div>
                  <div className="text-sm sm:text-base text-gray-600">On-time Delivery</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-primary-600 rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Why Choose Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base">Professional Team</h4>
                      <p className="text-primary-100 text-sm">Experienced drivers and logistics experts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base">Modern Fleet</h4>
                      <p className="text-primary-100 text-sm">Well-maintained vehicles with latest technology</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base">Comprehensive Coverage</h4>
                      <p className="text-primary-100 text-sm">State-wide and cross-country transportation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Comprehensive Services
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              From local deliveries to cross-country logistics, we provide end-to-end transportation 
              solutions tailored to your business needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                          {services.map((service) => (
                <div key={service.name} className="group bg-white border border-gray-200 rounded-xl p-6 sm:p-8 hover:shadow-lg hover:border-primary-300 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary-600 transition-colors">
                    <service.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{service.name}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs sm:text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Client Feedback Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Associations Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              We're proud to work with leading companies across various industries
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 items-center">
            {companies.map((company, index) => (
              <div key={index} className="flex items-center justify-center">
                <div className="w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-xs sm:text-sm">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Ready to Transform Your Transportation?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-primary-100 mb-6 sm:mb-8 max-w-3xl mx-auto">
            Join hundreds of satisfied customers who trust Ideal Transportation Solutions 
            for their logistics needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-900 hover:bg-gray-100 font-semibold rounded-lg transition-colors"
            >
              Get Started Today
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold rounded-lg transition-colors"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 text-center sm:text-left">
              <Image
                src="/logo_ideal.png"
                alt="Ideal Transportation Logo"
                width={200}
                height={43}
                className="w-auto mx-auto sm:mx-0"
              />
              <p className="text-sm sm:text-base text-gray-400">
                Your trusted partner in transportation solutions, delivering excellence 
                through innovation and reliability.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/services" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/about" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-2">
                <li><Link href="/services" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Freight Transport</Link></li>
                <li><Link href="/services" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Logistics Solutions</Link></li>
                <li><Link href="/services" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Fleet Management</Link></li>
                <li><Link href="/services" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">Tracking & Analytics</Link></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-400" />
                  <span className="text-sm sm:text-base text-gray-400">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-3">
                  <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-400" />
                  <span className="text-sm sm:text-base text-gray-400">info@idealtransportation.com</span>
                </div>
                <div className="flex items-start justify-center sm:justify-start space-x-3">
                  <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-400 mt-0.5" />
                  <span className="text-sm sm:text-base text-gray-400">16 Palmero Way, Manvel, Texas 77578</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
            <p className="text-sm sm:text-base text-gray-400">
              © 2024 Ideal Transportation Solutions Private Limited. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}

const services = [
  {
    name: 'Freight Transportation',
    description: 'Reliable freight transportation services across Texas and nationwide.',
    icon: TruckIcon,
    features: ['Full truckload services', 'Less-than-truckload (LTL)', 'Expedited shipping', 'Temperature-controlled transport']
  },
  {
    name: 'Logistics Management',
    description: 'End-to-end logistics solutions to optimize your supply chain.',
    icon: ChartBarIcon,
    features: ['Route optimization', 'Inventory management', 'Real-time tracking', 'Performance analytics']
  },
  {
    name: 'Fleet Management',
    description: 'Comprehensive fleet management and maintenance services.',
    icon: ShieldCheckIcon,
    features: ['Vehicle maintenance', 'Driver training', 'Safety compliance', 'Fuel management']
  },
  {
    name: 'Global Shipping',
    description: 'International shipping and customs clearance services.',
    icon: GlobeAltIcon,
    features: ['International freight', 'Customs clearance', 'Documentation support', 'Multi-modal transport']
  },
  {
    name: 'Specialized Transport',
    description: 'Specialized transportation for unique cargo requirements.',
    icon: ClockIcon,
    features: ['Oversized loads', 'Hazardous materials', 'Refrigerated transport', 'Express delivery']
  },
  {
    name: 'Customer Support',
    description: '24/7 customer support and dedicated account management.',
    icon: UserGroupIcon,
    features: ['24/7 support hotline', 'Dedicated account managers', 'Online tracking portal', 'Proactive notifications']
  }
]

const testimonials = [
  {
    quote: "Ideal Transportation has transformed our logistics operations. Their reliability and professional service are unmatched.",
    name: "Sarah Johnson",
    company: "TechCorp Industries"
  },
  {
    quote: "The team at Ideal Transportation goes above and beyond. They've become an essential part of our supply chain.",
    name: "Michael Chen",
    company: "Global Manufacturing Co."
  },
  {
    quote: "Outstanding service and competitive pricing. They've helped us reduce costs while improving delivery times.",
    name: "Emily Rodriguez",
    company: "Retail Solutions Inc."
  }
]

const companies = [
  "TechCorp", "GlobalMfg", "RetailSol", "LogiTech", "SupplyCo", "TransportPro"
]

const carouselImages = [
  {
    src: "/header1.jpg",
    alt: "Truck hauling cargo on highway"
  },
  {
    src: "/header2.jpg",
    alt: "Logistics warehouse with trucks"
  },
  {
    src: "/header3.jpg",
    alt: "Transportation fleet on road"
  },
  {
    src: "/header4.jpg",
    alt: "Professional trucking services"
  }
] 