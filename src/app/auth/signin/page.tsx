'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Camera, Mail, Chrome } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Removed automatic redirect logic to prevent redirect loops
  // Let NextAuth handle the authentication flow naturally

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('email', {
        email,
        callbackUrl: '/dashboard',
      });

      if (result?.ok) {
        setEmailSent(true);
      } else {
        alert('Failed to send sign-in email. Please try again.');
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a sign-in link to <strong>{email}</strong>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Click the link in your email to sign in. You can close this window.
              </p>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your photo selection workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="h-5 w-5 mr-2 text-gray-500" />
              Continue with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send sign-in link'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6">
            <div className="text-center text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
