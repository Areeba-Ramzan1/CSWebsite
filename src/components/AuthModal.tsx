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
  sendPasswordResetEmail
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

type AuthMode = 'login' | 'signup' | 'otp' | 'forgot';

export default function AuthModal({ isOpen, onClose, isDarkMode }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP logic states
  const [otpCode, setOtpCode] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [etherealUrl, setEtherealUrl] = useState<string | null>(null);
  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  
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

  // Individual digit handler for multiple boxes OTP entry
  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, ''); // Keep numbers only
    const newOtp = [...otpArray];
    
    if (!digit) {
      newOtp[index] = '';
      setOtpArray(newOtp);
      return;
    }

    newOtp[index] = digit[digit.length - 1]; // Use last character inputted
    setOtpArray(newOtp);

    // Auto focus next field
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpArray];
      if (!otpArray[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtpArray(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        newOtp[index] = '';
        setOtpArray(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length >= 6) {
      const arrayDigits = pasted.substring(0, 6).split('');
      setOtpArray(arrayDigits);
      otpInputsRef.current[5]?.focus();
    }
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

  // Handles either Log In, or initiates Sign Up by switching to OTP Verification mode
  const handlePrimarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEtherealUrl(null);

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
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpCode(generatedOtp);
      setOtpArray(['', '', '', '', '', '']);

      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, otpCode: generatedOtp })
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          if (data.previewUrl) {
            setEtherealUrl(data.previewUrl);
            setSuccess(`Security verification code generated! Open the student email inbox below to copy your OTP.`);
          } else {
            setSuccess(`A 6-digit security verification OTP has been sent to your email ID: ${email}`);
          }
          setMode('otp');
        } else {
          setError(data.error || 'Failed to send OTP email to your student account email address.');
        }
      } catch (err: any) {
        console.error('Failed dispatching verification code:', err);
        setError('Connection error dispatching verification. Please verify details and try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Standard Log In flow
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
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

  // Handles final OTP check & registration
  const handleOtpVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const joinedInputOtp = otpArray.join('');
    if (joinedInputOtp.length < 6) {
      setError('Please enter all 6 digits of the security OTP verification code.');
      return;
    }
    if (joinedInputOtp !== otpCode) {
      setError('Incorrect security verification code. Please check your inbox.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      setSuccess('Email OTP verified! Student account has been created successfully!');
      setTimeout(() => {
        setSuccess(null);
        onClose();
        // Clear all fields
        setName('');
        setEmail('');
        setPassword('');
        setOtpCode('');
        setOtpArray(['', '', '', '', '', '']);
        setEtherealUrl(null);
        setMode('login');
      }, 1500);
    } catch (err: any) {
      console.error('Firebase Auth signup error:', err);
      let errMsg = err?.message || 'Failed to complete registration.';
      if (err?.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Please log in instead.';
      }
      setError(errMsg);
      setMode('signup'); // Send them back to signup screen to fix email
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
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'otp' && 'Verify OTP'}
              {mode === 'forgot' && 'Reset Password'}
            </h3>
            <p className="text-xs text-gray-400">
              {mode === 'login' && 'Log in with your email to access saved resources.'}
              {mode === 'signup' && 'Register your university academic profile.'}
              {mode === 'otp' && 'Enter the generated 6-digit verification code.'}
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
            {success && mode !== 'otp' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-4 p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
                  mode === 'otp'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                }`}
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

          {/* 2. OTP Verification Panel */}
          {mode === 'otp' && (
            <form onSubmit={handleOtpVerifyAndRegister} className="space-y-6">
              {/* Simplified Header/Status */}
              <div className="text-center py-2 px-1">
                <p className="text-sm text-gray-400">
                  We sent a 6-digit OTP code to:
                </p>
                <p className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 font-sans tracking-wide mt-1 select-all break-all">
                  {email}
                </p>
              </div>

              <div className="space-y-3">
                {/* 6-DIGIT PREMIUM COMPONENT GRID */}
                <div className="flex justify-center gap-2 my-2">
                  {otpArray.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                      placeholder="•"
                      className={`w-11 sm:w-12 h-14 text-center text-xl sm:text-2xl font-black rounded-xl border-2 transition-all duration-200 outline-none select-none placeholder:opacity-20 ${
                        isDarkMode
                          ? 'bg-zinc-950 border-zinc-800 text-indigo-400 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-2 focus:ring-indigo-500/20'
                          : 'bg-indigo-50/20 border-slate-200 text-indigo-700 focus:border-indigo-650 focus:bg-indigo-50/10 focus:ring-2 focus:ring-indigo-600/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Simulated backup option (ONLY rendered in fallback/ethereal mode to prevent user blockages, but in a very minimal clean layout) */}
              {etherealUrl && (
                <div className="p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-xl text-center space-y-1.5">
                  <div className="text-[11px] text-gray-400 dark:text-zinc-305">
                    Preview OTP Code: <strong className="font-mono text-amber-550 dark:text-amber-400 select-all tracking-wider text-sm">{otpCode}</strong>
                  </div>
                  <a
                    href={etherealUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Icons.Mail className="w-3.5 h-3.5" />
                    Open simulated student webmail
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <Icons.Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Icons.CheckCircle className="w-5 h-5 text-white" />
                )}
                <span>Verify & Complete Sign Up</span>
              </button>
            </form>
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
              {mode === 'otp' && (
                <>
                  Entered incorrect account settings?
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
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
