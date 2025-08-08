import { Camera, Users, Shield, Zap, Check, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">PhotoSelect</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              The{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Photo Selection
              </span>
              <br />
              Platform for Professionals
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your photo delivery process. Let clients select their favorites 
              while you focus on capturing perfect moments. Built for photographers, 
              loved by clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#demo"
                className="border border-gray-300 text-gray-900 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Watch Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Free 14-day trial • No credit card required • Setup in 2 minutes
            </p>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[50%] top-0 ml-[-40rem] h-[25rem] w-[81.25rem] rotate-[30deg] bg-gradient-to-r from-blue-50 to-purple-50 opacity-20"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to deliver photos professionally
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features that make photo selection effortless for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Client Workspaces
              </h3>
              <p className="text-gray-600">
                Create isolated workspaces for each client. Secure, organized, 
                and professional photo delivery every time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Enterprise-grade security ensures your photos and client data 
                remain private and protected at all times.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Optimized for speed. Upload hundreds of photos and let clients 
                browse and select instantly, even on mobile.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-orange-100 p-3 rounded-lg w-fit mb-4">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Bulk Upload
              </h3>
              <p className="text-gray-600">
                Upload entire photo shoots in minutes. Drag, drop, and let our 
                system handle the rest automatically.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-red-100 p-3 rounded-lg w-fit mb-4">
                <Star className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Selection Tracking
              </h3>
              <p className="text-gray-600">
                See which photos clients love most. Export selections and 
                deliver exactly what they want, every time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="bg-indigo-100 p-3 rounded-lg w-fit mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Team Collaboration
              </h3>
              <p className="text-gray-600">
                Add photographers and assistants to your team. Manage permissions 
                and collaborate seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Up to 3 workspaces</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">100 photos per workspace</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Basic support</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors block text-center"
              >
                Get Started Free
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-black text-white p-8 rounded-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
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
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span>Unlimited workspaces</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span>Unlimited photos</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <span>Priority support</span>
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
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Everything in Professional</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Custom branding</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">API access</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-600">Dedicated support</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors block text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to streamline your photo delivery?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of photographers who trust PhotoSelect to deliver 
            their best work professionally.
          </p>
          <Link
            href="/auth/signin"
            className="bg-white text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">PhotoSelect</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="#" className="hover:text-gray-900">Privacy</Link>
              <Link href="#" className="hover:text-gray-900">Terms</Link>
              <Link href="#" className="hover:text-gray-900">Support</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            © 2024 PhotoSelect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
