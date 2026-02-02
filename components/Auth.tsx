// components/Auth.tsx
'use client'
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { EmailService } from '@/lib/services/emailService';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
         
    try {
      if (isLogin) {
        // Login logic
        await signInWithEmailAndPassword(auth, email, password);
        setMessage('Logged in successfully!');
      } else {
        // Sign up user
        await createUserWithEmailAndPassword(auth, email, password);
                 
        // Send welcome email via Formspree
        EmailService.sendWelcomeEmail(email, email.split('@')[0])
          .then(success => {
            if (success) {
              console.log('✅ Welcome email sent successfully');
              setMessage('Account created! Check your email for a welcome message.');
            } else {
              console.warn('⚠️ Welcome email failed');
              setMessage('Account created! (Email may have failed to send)');
            }
          })
          .catch(emailError => {
            console.error('❌ Email error:', emailError);
            setMessage('Account created! (Email service issue)');
          });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // User-friendly error messages
      let errorMessage = 'Authentication failed.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak (minimum 6 characters).';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      }
      
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-xl shadow-lg bg-white max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isLogin ? 'Login to Your Account' : 'Create Your Account'}
      </h2>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          message.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-600' 
            : 'bg-green-50 border border-green-200 text-green-600'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
            disabled={loading}
          />
        </div>
                 
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
            disabled={loading}
            minLength={6}
          />
          {!isLogin && (
            <p className="mt-1 text-xs text-gray-500">
              Minimum 6 characters
            </p>
          )}
        </div>
                 
        <button 
           type="submit"
           disabled={loading}
           className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
             loading 
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
           }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {isLogin ? 'Signing In...' : 'Creating Account...'}
            </div>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>
             
      <button
         onClick={() => setIsLogin(!isLogin)}
         disabled={loading}
         className="w-full mt-4 text-blue-600 hover:text-blue-800 disabled:text-gray-400 text-sm font-medium transition-colors"
      >
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>

      {!isLogin && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            After signing up, you'll receive a welcome email with more information.
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          By {isLogin ? 'signing in' : 'creating an account'}, you agree to our 
          <a href="/terms" className="text-blue-600 hover:underline ml-1">Terms of Service</a> 
          and <a href="/privacy" className="text-blue-600 hover:underline ml-1">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}