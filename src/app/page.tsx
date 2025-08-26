import {
  Camera,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import PricingSection from '@/components/PricingSection';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Allow all users to access homepage - no forced redirects
  // Users can navigate to their dashboards via navigation menu

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Dotted background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        ></div>
      </div>
      {/* Sticky Navigation */}
      <Navigation />
      <div style={{ paddingTop: '64px' }}>
        {' '}
        {/* Add padding for fixed navbar */}
        {/* Hero Section */}
        <section className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-black mb-8 tracking-tight">
                The{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Photo Selection
                  </span>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-lg -z-10"></div>
                </span>
                <br />
                Platform for Professionals
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Streamline your photo delivery process. Let clients select their
                favorites while you focus on capturing perfect moments.{' '}
                <span className="text-black font-medium">
                  Built for photographers, loved by clients.
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/auth/signin"
                  className="bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-all duration-200 inline-flex items-center justify-center group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="border border-gray-300 text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                Free 14-day trial • No credit card required • Setup in 2 minutes
              </p>
            </div>
          </div>
        </section>
        {/* ROI & Business Impact Section */}
        <section className="relative z-10 py-20 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
                Transform Your Photography Business
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join thousands of photographers who&apos;ve streamlined their
                workflow and increased client satisfaction
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Time Savings */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  75% Less Time
                </h3>
                <h4 className="text-lg font-semibold text-black mb-3">
                  On Photo Delivery
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Stop spending hours creating galleries and chasing clients for
                  selections. Automated workflows mean you deliver faster and
                  get paid sooner.
                </p>
              </div>

              {/* Client Satisfaction */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600 mb-2">
                  100% Happy
                </h3>
                <h4 className="text-lg font-semibold text-black mb-3">
                  Client Satisfaction
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Clients love the intuitive selection process. No more
                  confusing spreadsheets or endless email chains - just
                  beautiful, simple photo selection.
                </p>
              </div>

              {/* Revenue Growth */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-orange-600 mb-2">
                  40% More
                </h3>
                <h4 className="text-lg font-semibold text-black mb-3">
                  Bookings Per Month
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Professional delivery process builds trust and referrals.
                  Photographers report significant increases in repeat clients
                  and word-of-mouth bookings.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">
                Ready to transform your photography business?
              </p>
              <Link
                href="/auth/signin"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center justify-center group shadow-lg"
              >
                Start Your Free Trial Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
        {/* Testimonials Section */}
        <section className="relative z-10 py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
                Loved by Photographers Worldwide
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how PhotoSelect has transformed photography businesses
                across the globe
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Testimonial 1 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &quot;PhotoSelect completely transformed my workflow. What
                  used to take me 3-4 hours of back-and-forth emails now takes
                  15 minutes. My clients love how easy it is to select their
                  favorites!&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    S
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">Sarah Mitchell</p>
                    <p className="text-sm text-gray-600">
                      Wedding Photographer, Austin TX
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &quot;The professional presentation has elevated my brand
                  significantly. Clients are impressed before they even see
                  their photos. I've booked 6 new weddings just from referrals
                  this month!&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    M
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">Marcus Johnson</p>
                    <p className="text-sm text-gray-600">
                      Portrait Photographer, NYC
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &quot;As a busy mom running a photography business, time is
                  everything. PhotoSelect gave me back 10+ hours per week that I
                  can spend with my family or growing my business.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    E
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">Emma Rodriguez</p>
                    <p className="text-sm text-gray-600">
                      Family Photographer, San Diego
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 4 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &quot;My clients used to take weeks to get back to me with
                  their selections. Now they&apos;re done within 24 hours! The
                  real-time notifications keep everyone engaged and
                  excited.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    D
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">David Chen</p>
                    <p className="text-sm text-gray-600">
                      Event Photographer, Seattle
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 5 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "The ROI was immediate. I raised my prices 30% because the
                  professional delivery experience justifies premium pricing.
                  Best investment I've made for my business."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    L
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">Lisa Thompson</p>
                    <p className="text-sm text-gray-600">
                      Commercial Photographer, Chicago
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonial 6 */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Setup took literally 5 minutes. Within a week, I had my first
                  client using it and they were blown away. The learning curve
                  is zero - it just works perfectly."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    R
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-black">Ryan Parker</p>
                    <p className="text-sm text-gray-600">
                      Sports Photographer, Miami
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof Stats */}
            <div className="mt-16 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div>
                  <div className="text-3xl font-bold text-black mb-2">
                    15,000+
                  </div>
                  <div className="text-gray-600">Happy Photographers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black mb-2">
                    2.5M+
                  </div>
                  <div className="text-gray-600">Photos Delivered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-black mb-2">
                    99.8%
                  </div>
                  <div className="text-gray-600">Uptime Guarantee</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section id="features" className="relative z-10 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
                The Photo Selection Platform for the Web
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Used by professional photographers worldwide, PhotoSelect
                enables you to create{' '}
                <span className="text-black font-semibold">
                  high-quality photo selection experiences
                </span>{' '}
                with the power of modern web technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-blue-200">
                  <div className="bg-blue-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-blue-100 transition-colors">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Client Workspaces
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Create isolated workspaces for each client. Secure,
                    organized, and professional photo delivery every time with
                    enterprise-grade isolation.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-green-200">
                  <div className="bg-green-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-green-100 transition-colors">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Secure & Private
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Enterprise-grade security ensures your photos and client
                    data remain private and protected at all times with
                    end-to-end encryption.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-purple-200">
                  <div className="bg-purple-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-purple-100 transition-colors">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Lightning Fast
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Optimized for speed with advanced caching. Upload hundreds
                    of photos and let clients browse instantly, even on mobile
                    devices.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-orange-200">
                  <div className="bg-orange-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-orange-100 transition-colors">
                    <Camera className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Bulk Upload
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Upload entire photo shoots in minutes with drag-and-drop.
                    Our system handles processing, optimization, and
                    organization automatically.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-pink-200">
                  <div className="bg-pink-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-pink-100 transition-colors">
                    <Star className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Selection Tracking
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Advanced analytics show which photos clients love most.
                    Export selections and deliver exactly what they want, every
                    time.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="group">
                <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:border-indigo-200">
                  <div className="bg-indigo-50 p-3 rounded-lg w-fit mb-6 group-hover:bg-indigo-100 transition-colors">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-4">
                    Team Collaboration
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Add photographers and assistants to your team. Manage
                    permissions and collaborate seamlessly with role-based
                    access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Pricing Section */}
        <PricingSection
          headerTitle="Choose Your Plan"
          headerSubtitle="Start with our free plan or upgrade for more features and capabilities"
          className="bg-gray-50"
          compact={true}
        />
        {/* CTA Section */}
        <section className="relative z-10 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">
              Ready to streamline your photo delivery?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Join thousands of photographers who trust PhotoSelect to deliver
              their best work professionally and efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="bg-white text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center justify-center group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact-sales"
                className="border border-gray-600 text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-6">
              No credit card required • 14-day free trial • Enterprise support
              available
            </p>
          </div>
        </section>
        {/* Final CTA Section */}
        <section className="relative z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Photo Delivery?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join thousands of photographers who trust PhotoSelect to deliver
              their best work professionally and efficiently.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="bg-white text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center justify-center group"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact-sales"
                className="border border-gray-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              No credit card required • 14-day free trial • Enterprise support
              available
            </p>
          </div>
        </section>
        {/* Footer */}
        <footer className="relative z-10 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Camera className="h-6 w-6 text-black" />
                <span className="text-lg font-bold text-black">
                  PhotoSelect
                </span>
              </div>
              <div className="flex space-x-6 text-sm text-gray-600">
                <Link
                  href="/privacy"
                  className="hover:text-black transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-black transition-colors"
                >
                  Terms
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              2024 PhotoSelect. All rights reserved.
            </div>
          </div>
        </footer>
      </div>{' '}
      {/* Close the padding div */}
    </div>
  );
}
