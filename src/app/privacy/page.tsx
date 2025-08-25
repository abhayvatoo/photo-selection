import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-700 mb-4">
                At PhotoSelect, we collect information you provide directly to
                us, such as when you create an account, upload photos, or
                contact us for support.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Account information (name, email address)</li>
                <li>Photos and related metadata</li>
                <li>Usage data and analytics</li>
                <li>Communication preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to provide, maintain, and
                improve our services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>To provide photo selection and delivery services</li>
                <li>To communicate with you about your account</li>
                <li>To improve our platform and develop new features</li>
                <li>To ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Data Security
              </h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-black mb-4">
                Contact Us
              </h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please
                contact us at{' '}
                <a
                  href="mailto:privacy@photoselect.com"
                  className="text-blue-600 hover:underline"
                >
                  privacy@photoselect.com
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
