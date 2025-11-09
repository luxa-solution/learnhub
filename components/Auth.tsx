'use client'
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
         
    try {
      if (isLogin) {
        // Login logic
        await signInWithEmailAndPassword(auth, email, password);
        alert('Logged in successfully!');
      } else {
        // Sign up user
        await createUserWithEmailAndPassword(auth, email, password);
                 
        fetch('/api/emails/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
             email: email, 
             name: email.split('@')[0] 
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Welcome email sent successfully to:', email);
          } else {
            console.error('Failed to send welcome email:', data.error);
          }
        })
        .catch(emailError => {
          console.error('Failed to send welcome email:', emailError);
        });
                 
        alert('Account created successfully! Check your email for a welcome message.');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-4">
        {isLogin ? 'Login to Your Account' : 'Create Your Account'}
      </h2>
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>
                 
        <button 
           type="submit"
           disabled={loading}
           className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
             loading 
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
           }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
         className="w-full mt-4 text-blue-500 hover:text-blue-600 disabled:text-gray-400 text-sm"
      >
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>

      {!isLogin && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          By creating an account, you'll receive a welcome email with more information about our platform.
        </p>
      )}
    </div>
  );
}