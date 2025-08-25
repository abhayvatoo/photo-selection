import Link from 'next/link';
import { ArrowLeft, Mail, MessageCircle, Book, Phone } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div style={{ paddingTop: '64px' }}>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-black mb-4">
              Support Center
            </h1>
            <p className="text-xl text-gray-600">
              Get help with PhotoSelect and find answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Email Support */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-blue-500 p-3 rounded-lg w-fit mb-4">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Email Support
              </h3>
              <p className="text-gray-600 mb-4">
                Get detailed help from our support team. We typically respond
                within 24 hours.
              </p>
              <a
                href="mailto:support@photoselect.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                support@photoselect.com
              </a>
            </div>

            {/* Live Chat */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-green-500 p-3 rounded-lg w-fit mb-4">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Live Chat
              </h3>
              <p className="text-gray-600 mb-4">
                Chat with our support team in real-time. Available
                Monday-Friday, 9 AM - 6 PM EST.
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Start Chat
              </button>
            </div>

            {/* Documentation */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="bg-purple-500 p-3 rounded-lg w-fit mb-4">
                <Book className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">
                Documentation
              </h3>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive guides and tutorials to get the most
                out of PhotoSelect.
              </p>
              <Link
                href="/documentation"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                View Docs
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-black mb-2">
                  How do I upload photos to a workspace?
                </h3>
                <p className="text-gray-600">
                  Navigate to your workspace, click the upload area, and select
                  your photos. You can upload multiple photos at once by
                  selecting them all.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-black mb-2">
                  How do clients select their favorite photos?
                </h3>
                <p className="text-gray-600">
                  Clients receive an invitation link to your workspace where
                  they can view all photos and click the heart icon to select
                  their favorites.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Can I invite multiple clients to the same workspace?
                </h3>
                <p className="text-gray-600">
                  Yes! You can invite multiple clients and staff members to
                  collaborate on photo selection within the same workspace.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-black mb-2">
                  How do I download selected photos?
                </h3>
                <p className="text-gray-600">
                  In your workspace, you can download individual photos or use
                  the bulk download feature to get all selected photos as a ZIP
                  file.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-black mb-6 text-center">
              Still Need Help?
            </h2>
            <form className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How can we help?"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your question or issue..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
