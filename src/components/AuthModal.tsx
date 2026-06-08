/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function AuthModal({ isOpen, onClose, isDarkMode }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Successfully signed in with Google!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Google Auth Sign In error:', err);
      setError(err?.message || 'Google account sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        // Sign up flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
        setSuccess('Account created successfully! Welcome to CS Resource Center!');
      } else {
        // Log in flow
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Logged in successfully!');
      }
      setTimeout(() => {
        setSuccess(null);
        onClose();
        // Clear forms
        setName('');
        setEmail('');
        setPassword('');
      }, 1500);
    } catch (err: any) {
      console.error('Firebase Auth email error:', err);
      let errMsg = err?.message || 'Authentication failed. Please verify credentials.';
      if (err?.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Try logging in instead.';
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        errMsg = 'Incorrect email or password. Please check your credentials.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password sign-in has not been enabled yet on your Firebase Console. Under Build > Authentication > Sign-in Method, please enable the Email/Password provider.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm focus:outline-none"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-md p-6 md:p-8 rounded-2xl border shadow-2xl transition-all z-10 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto ${
            isDarkMode 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
              : 'bg-white border-slate-200 text-slate-950'
          }`}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-500/10 transition-colors"
          >
            <Icons.X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black font-display tracking-tight leading-none uppercase text-indigo-600 dark:text-indigo-400 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs text-gray-400">
              {isSignUp 
                ? 'Join to backup your bookmarked categories & request custom materials' 
                : 'Log in to sync your saved resources and bookmarks across all devices'}
            </p>
          </div>

          {/* Success / Error banners */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs leading-relaxed"
              >
                <div className="flex gap-2 font-mono">
                  <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error:</span> {error}
                    {error.includes('Email/Password') && (
                      <div className="mt-1 bg-red-500/10 p-1.5 rounded text-[10px] text-gray-300 font-sans border border-red-500/20">
                        <strong>Rep instructions:</strong> Enable <strong>Email/Password</strong> under <em>Build &gt; Authentication &gt; Sign-in method</em> in Firebase Console.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-mono flex items-center gap-2"
              >
                <Icons.CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-bold font-mono text-gray-400">Your Full Name</label>
                <div className="relative">
                  <Icons.User className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hammad Ahmed"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                      isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold font-mono text-gray-400">Email Address</label>
              <div className="relative">
                <Icons.Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hammad@student.fuuast.edu.pk"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold font-mono text-gray-400">Password</label>
              <div className="relative">
                <Icons.Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-0.5 rounded text-gray-400 hover:text-indigo-500"
                >
                  {showPassword ? <Icons.EyeOff className="w-4 h-4" /> : <Icons.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:bg-indigo-700/60"
            >
              {loading ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing connection...</span>
                </>
              ) : (
                <>
                  <Icons.LogIn className="w-4 h-4" />
                  <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Social Sign-In boundary */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-3 h-px bg-slate-500/10 dark:bg-zinc-800" />
            <span className={`relative px-4 text-[10px] font-bold font-mono uppercase tracking-wider ${
              isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
            }`}>
              or continue with
            </span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-2.5 flex items-center justify-center gap-2.5 rounded-xl border text-xs font-bold transition-all hover:bg-slate-500/5 cursor-pointer ${
              isDarkMode ? 'bg-zinc-950 border-zinc-850' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <Icons.Chrome className="w-4 h-4 text-rose-500" />
            <span>Google Workspace / Gmail</span>
          </button>

          {/* Alternate flow trigger */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              {isSignUp ? 'Already have an academic account?' : 'New student in the CS Department?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="ml-1.5 text-xs text-indigo-500 hover:underline font-extrabold focus:outline-none"
              >
                {isSignUp ? 'Log In Instead' : 'Create Account'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
