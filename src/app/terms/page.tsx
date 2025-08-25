import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div style={{ paddingTop: '64px' }}>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-black mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Acceptance of Terms
              </h2>
              <p className="text-gray-700 mb-4">
                By accessing and using PhotoSelect, you accept and agree to be
                bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Use License
              </h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily use PhotoSelect for
                personal and commercial photography business purposes.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  This license shall automatically terminate if you violate any
                  of these restrictions
                </li>
                <li>You may not modify or copy the materials</li>
                <li>
                  You may not use the materials for any commercial purpose
                  without explicit permission
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                User Accounts
              </h2>
              <p className="text-gray-700 mb-4">
                When you create an account with us, you must provide information
                that is accurate, complete, and current at all times.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Content Ownership
              </h2>
              <p className="text-gray-700 mb-4">
                You retain all rights to photos and content you upload to
                PhotoSelect. We do not claim ownership of your content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-black mb-4">
                Termination
              </h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without
                prior notice, for conduct that we believe violates these Terms
                of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Contact Information
              </h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please
                contact us at{' '}
                <a
                  href="mailto:legal@photoselect.com"
                  className="text-blue-600 hover:underline"
                >
                  legal@photoselect.com
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
