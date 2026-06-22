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
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

type AuthMode = 'login' | 'signup' | 'verification-sent' | 'forgot';

export default function AuthModal({ isOpen, onClose, isDarkMode }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
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

  const handleClose = async () => {
    onClose();
  };

  if (!isOpen) return null;

  // Handles Forgot Password (Password Reset Email)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please fill in your registered email first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('A password reset link has been successfully sent to your email inbox (or spam folder).');
    } catch (err: any) {
      console.error('Password reset error:', err);
      let errMsg = err?.message || 'Failed to trigger recovery email. Please check your address.';
      if (err?.code === 'auth/user-not-found') {
        errMsg = 'No student account found registered under this email.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handles either Log In, or initiates Sign Up by sending standard email verification link
  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || (mode === 'signup' && !name)) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name
        });
        
        try {
          await sendEmailVerification(userCredential.user);
        } catch (emailErr) {
          console.warn('Silent email verification send failed:', emailErr);
        }
        
        setSuccess('Account created and logged in successfully!');
        setTimeout(() => {
          setSuccess(null);
          onClose();
          setName('');
          setEmail('');
          setPassword('');
          setMode('login');
        }, 1500);
      } catch (err: any) {
        console.error('Firebase Auth signup error:', err);
        let errMsg = err?.message || 'Failed to complete registration.';
        if (err?.code === 'auth/email-already-in-use') {
          errMsg = 'This email is already registered. Please log in instead.';
        } else if (err?.code === 'auth/invalid-email') {
          errMsg = 'The email address format is invalid.';
        } else if (err?.code === 'auth/weak-password') {
          errMsg = 'The password must be at least 6 characters.';
        }
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    } else {
      // Standard Log In flow
      setLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          setSuccess(null);
          onClose();
          // Reset fields
          setName('');
          setEmail('');
          setPassword('');
          setMode('login');
        }, 1500);
      } catch (err: any) {
        console.error('Firebase Auth login error:', err);
        let errMsg = err?.message || 'Authentication failed. Please verify credentials.';
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
          errMsg = 'Incorrect email or password. Please verify your credentials.';
        }
        setError(errMsg);
        setLoading(false);
      }
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
          onClick={handleClose}
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
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-500/10 transition-colors"
          >
            <Icons.X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black font-display tracking-tight leading-none uppercase text-indigo-600 dark:text-indigo-400 mb-2">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'verification-sent' && 'Verify Email'}
              {mode === 'forgot' && 'Reset Password'}
            </h3>
            <p className="text-xs text-gray-400">
              {mode === 'login' && 'Log in with your email to access saved resources.'}
              {mode === 'signup' && 'Register your university academic profile.'}
              {mode === 'verification-sent' && 'Check your inbox for the activation link.'}
              {mode === 'forgot' && 'Request a secure login password recovery link.'}
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
                  </div>
                </div>
              </motion.div>
            )}
            {success && mode !== 'verification-sent' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg text-xs font-mono flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
              >
                <Icons.CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Login or Signup Forms */}
          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handlePrimarySubmit} className="space-y-4">
              {mode === 'signup' && (
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
                    placeholder="student123@gmail.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                      isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold font-mono text-gray-400">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-2xs text-indigo-500 hover:underline hover:text-indigo-400 outline-none"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
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
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Icons.LogIn className="w-4 h-4" />
                    <span>{mode === 'signup' ? 'Proceed with Sign Up' : 'Log In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. Verification Email Sent Panel */}
          {mode === 'verification-sent' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center my-2">
                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 animate-pulse">
                  <Icons.Mail className="w-12 h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400 font-sans">
                  We've sent a secure activation link to:
                </p>
                <p className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 font-mono tracking-wide break-all bg-indigo-500/5 py-1 px-3 rounded-lg select-all inline-block max-w-full">
                  {email}
                </p>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto font-sans">
                Please open your inbox and click the verification link to proceed. Check your spam/junk folder if the link doesn't show up within a minute.
              </p>

              {success && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-2xs font-mono leading-relaxed">
                  {success}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    try {
                      if (auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        setSuccess('Success! A fresh activation link has been resent.');
                      } else {
                        setError('Active session not found. Please log in first.');
                      }
                    } catch (err: any) {
                      console.error('Failed to resend:', err);
                      let errMsg = err?.message || 'Failed to dispatch activation email. Please try again.';
                      if (err?.code === 'auth/too-many-requests') {
                        errMsg = 'Too many requests. Please wait a moment before trying again.';
                      }
                      setError(errMsg);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Icons.RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Resend Verification Email</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    try {
                      if (auth.currentUser) {
                        await auth.currentUser.reload();
                        if (auth.currentUser.emailVerified) {
                          setSuccess('Your academic profile is successfully activated!');
                          setTimeout(() => {
                            setSuccess(null);
                            onClose();
                            setName('');
                            setEmail('');
                            setPassword('');
                            setMode('login');
                          }, 1500);
                        } else {
                          setError('Verification link has not been clicked yet. Please refresh & verify your email.');
                        }
                      } else {
                        setError('Session lost. Please log in manually.');
                        setMode('login');
                      }
                    } catch (err: any) {
                      console.error('Reload auth status failed:', err);
                      setError('Failed to check verification status. Please make sure to click the link first.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-650/20 active:scale-[0.98]"
                >
                  <Icons.CheckCircle className="w-5 h-5 text-white" />
                  <span>I have verified my email</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Password Reset Request Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold font-mono text-gray-400">Registered Email Address</label>
                <div className="relative">
                  <Icons.Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student123@gmail.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                      isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {loading ? (
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.Send className="w-4 h-4" />
                )}
                <span>Send Password Reset Email</span>
              </button>
            </form>
          )}

          {/* Alternate flow triggers */}
          <div className="mt-6 text-center border-t border-slate-500/10 dark:border-zinc-800/60 pt-4">
            <p className="text-xs text-slate-400">
              {mode === 'login' && (
                <>
                  New student in the CS Department?
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="ml-1.5 text-xs text-indigo-500 hover:underline font-extrabold focus:outline-none"
                  >
                    Create Account
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <>
                  Already registered your student profile?
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="ml-1.5 text-xs text-indigo-500 hover:underline font-extrabold focus:outline-none"
                  >
                    Log In
                  </button>
                </>
              )}
              {mode === 'verification-sent' && (
                <>
                  Entered incorrect account settings?
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setSuccess(null);
                      if (auth.currentUser) {
                        try {
                          await auth.signOut();
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      setMode('signup');
                    }}
                    className="ml-1.5 text-xs text-indigo-500 hover:underline font-extrabold focus:outline-none"
                  >
                    Back to Signup
                  </button>
                </>
              )}
              {mode === 'forgot' && (
                <>
                  Remembered your password?
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="ml-1.5 text-xs text-indigo-500 hover:underline font-extrabold focus:outline-none"
                  >
                    Back to Log In
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
