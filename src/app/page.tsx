import { Camera, Users, Shield, Zap, ArrowRight, Star, Code, Layers, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Allow all users to access homepage - no forced redirects
  // Users can navigate to their dashboards via navigation menu

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Dotted background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-black" />
              <span className="text-xl font-bold text-black">PhotoSelect</span>
            </div>
            <div className="flex items-center space-x-4">
              {session?.user ? (
                <>
                  <span className="text-gray-600 text-sm">
                    Welcome, {session.user.name || session.user.email}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/api/auth/signout"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-600 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

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
              Streamline your photo delivery process. Let clients select their favorites 
              while you focus on capturing perfect moments.{' '}
              <span className="text-black font-medium">Built for photographers, loved by clients.</span>
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

      {/* Technology Stack Section */}
      <section className="relative z-10 py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Built on a foundation of fast, production-grade tooling
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Next.js */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
              <div className="bg-black p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Next.js</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                The React framework for production. Built on the latest React features, 
                including Server Components and Actions for optimal performance.
              </p>
            </div>

            {/* Authentication */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">NextAuth</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Complete authentication solution with support for multiple providers, 
                JWT sessions, and enterprise-grade security features.
              </p>
            </div>

            {/* Database */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center group hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-lg w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">PostgreSQL</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Powerful relational database with Prisma ORM for type-safe queries 
                and seamless database operations.
              </p>
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
              Used by professional photographers worldwide, PhotoSelect enables you to create{' '}
              <span className="text-black font-semibold">high-quality photo selection experiences</span>{' '}
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
                  Create isolated workspaces for each client. Secure, organized, 
                  and professional photo delivery every time with enterprise-grade isolation.
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
                  Enterprise-grade security ensures your photos and client data 
                  remain private and protected at all times with end-to-end encryption.
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
                  Optimized for speed with advanced caching. Upload hundreds of photos 
                  and let clients browse instantly, even on mobile devices.
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
                  Our system handles processing, optimization, and organization automatically.
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
                  Export selections and deliver exactly what they want, every time.
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
                  Add photographers and assistants to your team. 
                  Manage permissions and collaborate seamlessly with role-based access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-black mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-black">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Up to 3 workspaces</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">100 photos per workspace</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Basic support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Email notifications</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="w-full bg-gray-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors block text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-black text-white p-8 rounded-xl relative transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>Unlimited workspaces</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>Unlimited photos</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span>Advanced analytics</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="w-full bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors block text-center"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold text-black mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-black">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Everything in Professional</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Custom branding</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">API access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">SLA guarantee</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="w-full bg-gray-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors block text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to streamline your photo delivery?
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
              href="/auth/signin"
              className="border border-gray-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            No credit card required • 14-day free trial • Enterprise support available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Camera className="h-6 w-6 text-black" />
              <span className="text-lg font-bold text-black">PhotoSelect</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-black transition-colors">Terms</Link>
              <Link href="#" className="hover:text-black transition-colors">Support</Link>
              <Link href="#" className="hover:text-black transition-colors">Documentation</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2024 PhotoSelect. All rights reserved. Built with Next.js and ❤️
          </div>
        </div>
      </footer>
    </div>
  );
}
