
import React, { useState, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from './Button';
import { Icon } from './Icon';
// Removed MarkdownInput import as it's not suitable for email/password fields.

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // Login successful, App.tsx will detect session change and redirect
      }
    } catch (err: any) {
      setError(err.error_description || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-stone-100 via-neutral-100 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-neutral-200/80">
        <div className="text-center mb-6 sm:mb-8">
          <Icon name="BookOpen" className="w-12 h-12 sm:w-16 sm:h-16 text-sky-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-800">
            StoryGen<span className="text-sky-600">Pro</span>
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base mt-1">
            {isSignUp ? 'Create an account to start your journey.' : 'Welcome back! Please sign in.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
          {/* Fix: Replaced MarkdownInput with standard input for email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-600 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
              className="w-full p-3 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 selection:bg-sky-200 selection:text-sky-700 text-sm sm:text-base"
              autoComplete="email"
            />
          </div>
          {/* Fix: Replaced MarkdownInput with standard input for password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-600 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full p-3 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-neutral-50 text-neutral-800 placeholder:text-neutral-400 selection:bg-sky-200 selection:text-sky-700 text-sm sm:text-base"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full text-sm sm:text-base"
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
        </form>

        {error && <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded-md text-center">{error}</p>}
        {message && <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded-md text-center">{message}</p>}

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            disabled={loading}
            className="text-sm text-sky-600 hover:text-sky-700 hover:underline focus:outline-none focus:underline disabled:text-neutral-400"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
      <footer className="text-center mt-6 sm:mt-8 text-neutral-500 text-xs">
        &copy; {new Date().getFullYear()} StoryGenPro. All rights reserved.
      </footer>
    </div>
  );
};
