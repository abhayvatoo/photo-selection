import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Users,
  Upload,
  Download,
  Settings,
  Shield,
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function DocumentationPage() {
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
              Documentation
            </h1>
            <p className="text-xl text-gray-600">
              Complete guide to using PhotoSelect for your photography business
            </p>
          </div>

          {/* Quick Start Guide */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-8">
              Quick Start Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="bg-blue-500 p-2 rounded-lg w-fit mb-4">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  1. Create Your Account
                </h3>
                <p className="text-gray-600 text-sm">
                  Sign up for PhotoSelect and create your first workspace to
                  organize your photo projects.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="bg-green-500 p-2 rounded-lg w-fit mb-4">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  2. Upload Photos
                </h3>
                <p className="text-gray-600 text-sm">
                  Upload your photos to the workspace. Drag and drop multiple
                  files for quick uploads.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="bg-purple-500 p-2 rounded-lg w-fit mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  3. Invite Clients
                </h3>
                <p className="text-gray-600 text-sm">
                  Send secure invitation links to your clients so they can view
                  and select their favorite photos.
                </p>
              </div>
            </div>
          </div>

          {/* Feature Guides */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-8">
              Feature Guides
            </h2>
            <div className="space-y-8">
              {/* Workspace Management */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <Settings className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-black">
                    Workspace Management
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Learn how to create, organize, and manage your photo
                  workspaces effectively.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Creating Workspaces
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Click &quot;Create Workspace&quot; from your dashboard</li>
                      <li>
                        • Enter a descriptive name (e.g., &quot;Smith Wedding 2024&quot;)
                      </li>
                      <li>• Add an optional description for context</li>
                      <li>• Your workspace is ready to use!</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Workspace Settings
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Customize workspace name and description</li>
                      <li>• Manage user permissions and access</li>
                      <li>• Set workspace status (Active/Inactive)</li>
                      <li>• Archive completed projects</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <Upload className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-black">
                    Photo Upload
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Upload and manage your photos with ease using our intuitive
                  upload system.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Uploading Photos
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Drag and drop files onto the upload area</li>
                      <li>• Or click to browse and select files</li>
                      <li>• Upload multiple photos simultaneously</li>
                      <li>• Real-time upload progress tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Supported Formats
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• JPEG (.jpg, .jpeg)</li>
                      <li>• PNG (.png)</li>
                      <li>• WebP (.webp)</li>
                      <li>• Maximum file size: 50MB per photo</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Client Invitations */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <Users className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-black">
                    Client Invitations
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Securely invite clients and team members to collaborate on
                  photo selection.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Sending Invitations
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Enter client email addresses</li>
                      <li>• Choose appropriate role (Client or Staff)</li>
                      <li>• Add personal message (optional)</li>
                      <li>• Send secure invitation links</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      User Roles
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>
                        • <strong>Business Owner:</strong> Full workspace
                        control
                      </li>
                      <li>
                        • <strong>Staff:</strong> Limited management access
                      </li>
                      <li>
                        • <strong>Client:</strong> View and select photos only
                      </li>
                      <li>
                        • <strong>Super Admin:</strong> Platform administration
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Photo Selection */}
              <div className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="flex items-center mb-4">
                  <Download className="h-6 w-6 text-orange-600 mr-3" />
                  <h3 className="text-2xl font-semibold text-black">
                    Photo Selection & Download
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Help clients select their favorite photos and manage downloads
                  efficiently.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Selection Process
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Clients click heart icons to select photos</li>
                      <li>• Real-time selection updates for all users</li>
                      <li>• Visual indicators show selected photos</li>
                      <li>• Bulk select/deselect options available</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-2">
                      Download Options
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Download individual photos</li>
                      <li>• Bulk download selected photos as ZIP</li>
                      <li>• High-quality original files</li>
                      <li>• Download progress tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-black mb-8">
              Best Practices
            </h2>
            <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-black">
                  Tips for Success
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-black mb-2">
                    Workflow Organization
                  </h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Use descriptive workspace names</li>
                    <li>• Create separate workspaces for each project</li>
                    <li>• Upload photos in logical batches</li>
                    <li>• Set clear expectations with clients</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">
                    Client Communication
                  </h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Send invitation emails with clear instructions</li>
                    <li>• Set deadlines for photo selection</li>
                    <li>• Follow up on pending selections</li>
                    <li>• Provide support contact information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="text-center bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-black mb-4">
              Need More Help?
            </h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is here to
              help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/support"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@photoselect.com"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
