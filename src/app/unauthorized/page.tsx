import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-red-100 p-3 rounded-full">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don't have permission to access this resource
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              This page requires specific permissions that your account doesn't have.
            </p>
            <p className="text-sm text-gray-600">
              If you believe this is an error, please contact your administrator.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
