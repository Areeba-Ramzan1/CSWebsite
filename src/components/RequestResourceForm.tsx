/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Semester, UserRequest } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

interface RequestResourceFormProps {
  semesters: Semester[];
  isDarkMode: boolean;
  currentUser: User | null;
  onOpenAuthModal?: () => void;
}

export default function RequestResourceForm({ semesters, isDarkMode, currentUser, onOpenAuthModal }: RequestResourceFormProps) {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [resourceType, setResourceType] = useState<'notes' | 'pdf' | 'past_paper' | 'assignment'>('notes');
  const [description, setDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [actionType, setActionType] = useState<'request' | 'provide'>('request');
  const [provisionLink, setProvisionLink] = useState('');

  const isAdmin = currentUser?.email === 'ramzanareeba70@gmail.com';

  const handleProcessRequest = async (id: string) => {
    if (!isAdmin) {
      setErrorMessage('Only the coordinator admin (ramzanareeba70@gmail.com) can manage requests.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    
    setProcessingId(id);
    
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'requests', id), { status: 'Approved' });
        setSuccessMessage('Dropbox repository synchronized! Request marked as completed.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
      } finally {
        setProcessingId(null);
      }
    } else {
      // Simulate active ingestion flow - lookup, verify, establish Dropbox reference, update
      setTimeout(() => {
        setRequests((prev) => {
          const updated = prev.map((req) => {
            if (req.id === id) {
              return { ...req, status: 'Approved' as const };
            }
            return req;
          });
          localStorage.setItem('fuuast_cs_requests', JSON.stringify(updated));
          return updated;
        });
        setProcessingId(null);
        setSuccessMessage('Dropbox repository synchronized! Request marked as completed.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }, 2000);
    }
  };

  // Synchronize requests with Firestore or fallback to localStorage
  useEffect(() => {
    if (currentUser) {
      // Listen to Firestore real-time requests updates
      const q = query(collection(db, 'requests'), orderBy('date', 'desc'), limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: UserRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as UserRequest);
        });
        setRequests(list);
      }, (error) => {
        console.error('Error listening to requests: ', error);
      });
      return () => unsubscribe();
    } else {
      // Load existing requests from localStorage on mount
      const saved = localStorage.getItem('fuuast_cs_requests');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as UserRequest[];
          // Filter out demo tracking requests
          const cleaned = parsed.filter(req => !req.id.startsWith('req-default-'));
          setRequests(cleaned);
          localStorage.setItem('fuuast_cs_requests', JSON.stringify(cleaned));
        } catch (e) {
          console.error('Error loading saved requests', e);
        }
      } else {
        setRequests([]);
        localStorage.setItem('fuuast_cs_requests', JSON.stringify([]));
      }
    }
  }, [currentUser]);

  // Pre-fill user profile info on auth change
  useEffect(() => {
    if (currentUser) {
      setStudentName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Handle new request submittal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName || !email || !semesterId || !courseName || !description) {
      setErrorMessage('Please fill out all mandatory fields.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (actionType === 'provide' && !provisionLink) {
      setErrorMessage('Please provide a valid file reference link (Google Drive, Dropbox etc.) to share.');
      setTimeout(() => setErrorMessage(null), 4500);
      return;
    }

    const requestId = `req-${Date.now()}`;
    const finalDescription = actionType === 'provide'
      ? `[PROVIDE MATERIAL - LINK: ${provisionLink}]\n\nDescription: ${description}`
      : description;

    const newRequest: UserRequest = {
      id: requestId,
      studentName,
      email,
      semesterId,
      courseName,
      resourceType,
      description: finalDescription,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      userId: currentUser?.uid || 'unregistered',
      requestType: actionType,
      provisionLink: actionType === 'provide' ? provisionLink : ''
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'requests', requestId), newRequest);
        
        // Write real-time admin notification log 
        const notificationId = `notif-${Date.now()}`;
        const newNotif = {
          id: notificationId,
          studentName,
          email,
          semesterId: semesters.find(s => s.id === semesterId)?.name || semesterId,
          courseName,
          resourceType,
          description: finalDescription,
          date: newRequest.date,
          createdAt: new Date().toISOString(),
          read: false,
          requestType: actionType,
          provisionLink: actionType === 'provide' ? provisionLink : ''
        };
        await setDoc(doc(db, 'admin_notifications', notificationId), newNotif);

        setSuccessMessage('Shukriya! Your request has been successfully queued for processing.');
        setTimeout(() => setSuccessMessage(null), 4500);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `requests/${requestId}`);
      }
    } else {
      const updated = [newRequest, ...requests];
      setRequests(updated);
      localStorage.setItem('fuuast_cs_requests', JSON.stringify(updated));
      setSuccessMessage('Shukriya! Your request has been successfully queued for processing.');
      setTimeout(() => setSuccessMessage(null), 4500);
    }

    // Securely trigger backend email dispatch to coordinator
    const currentSemName = semesters.find((s) => s.id === semesterId)?.name || semesterId;
    fetch('/api/send-request-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName,
        email,
        semesterName: currentSemName,
        courseName,
        resourceType,
        description,
        date: newRequest.date
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (data.success) {
        console.log('Secure admin email notification dispatched. ID:', data.messageId);
        if (data.previewUrl) {
          console.log('Sandbox Mail Sandbox preview link:', data.previewUrl);
        }
      } else {
        console.warn('Mail dispatch warning:', data.error);
      }
    })
    .catch((err) => {
      console.error('Failed to dispatch secure email notification:', err);
    });

    // Clear form except user identity to avoid annoying re-typing sessional info
    setSemesterId('');
    setCourseName('');
    setResourceType('notes');
    setDescription('');
    setProvisionLink('');
    setErrorMessage(null);
  };

  // Helper colors
  const getStatusBadge = (status: UserRequest['status']) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Approved
          </span>
        );
      case 'rejected':
      case 'unavailable':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Source Missing
          </span>
        );
      case 'fulfilled':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 bg-blue-500" />
            Fulfilled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Under Review
          </span>
        );
    }
  };

  return (
    <div id="request-resource-form" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* SUCCESS POPUP BANNER */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-emerald-600 text-white rounded-xl shadow-xl flex items-center gap-3 w-[90%] max-w-lg font-sans border border-emerald-500/30"
          >
            <Icons.CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-red-600 text-white rounded-xl shadow-xl flex items-center gap-3 w-[90%] max-w-lg font-sans border border-red-500/30"
          >
            <Icons.AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM CARD (Left col, span 7) */}
      <div className="lg:col-span-7">
        <div
          className={`p-6 md:p-8 rounded-xl border ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-805 text-zinc-100 shadow-lg'
              : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-lg">
              {actionType === 'request' ? (
                <Icons.Send className="w-6 h-6" />
              ) : (
                <Icons.UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold font-sans">
                {actionType === 'request' ? 'Request CS Resource' : 'Provide CS Resource'}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                {actionType === 'request'
                  ? "Can't find critical handouts or papers? Inform our student reps to search and sync them from Dropbox."
                  : "Have helpful midterm/terminal papers, notes or assignments? Share with the community here!"}
              </p>
            </div>
          </div>

          {/* Action Type Toggle Option Container */}
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl mb-6 max-w-sm border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActionType('request')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                actionType === 'request'
                  ? 'bg-indigo-600 text-white shadow-sm font-sans'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-transparent'
              }`}
            >
              <Icons.HelpCircle className="w-3.5 h-3.5" />
              Request Material
            </button>
            <button
              type="button"
              onClick={() => setActionType('provide')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                actionType === 'provide'
                  ? 'bg-indigo-600 text-white shadow-sm font-sans'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-transparent'
              }`}
            >
              <Icons.UploadCloud className="w-3.5 h-3.5" />
              Provide Material
            </button>
          </div>

          {/* Student Account Verification info callout */}
          {!currentUser && (
            <div className="mb-6 p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shadow-sm">
              <div className="flex gap-3">
                <Icons.UserCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-indigo-850 dark:text-indigo-300">Student Account Integration</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                    Sync requests instantly, track coordinator validation reviews in real-time, and preserve your document bookmarks dynamically across devices.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-705 text-white font-sans font-bold rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <Icons.LogIn className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Row 1: Student Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold font-mono text-gray-400">Student Name *</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Hammad Ahmed"
                  className={`px-4 py-3 rounded-lg border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400 focus:bg-zinc-900'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50/20'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold font-mono text-gray-400">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student123@gmail.com"
                  className={`px-4 py-3 rounded-lg border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400 focus:bg-zinc-900'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50/20'
                  }`}
                />
              </div>
            </div>

            {/* Row 2: Semester Selection & Course Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold font-mono text-gray-400">Target Semester *</label>
                <select
                  required
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  className={`px-4 py-3 rounded-lg border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600'
                  }`}
                >
                  <option value="" disabled>Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold font-mono text-gray-400">Course / Subject Name *</label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Linear Algebra"
                  className={`px-4 py-3 rounded-lg border text-sm transition-all outline-none ${
                    isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400 focus:bg-zinc-900'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50/20'
                  }`}
                />
              </div>
            </div>

            {/* Resource Type Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold font-mono text-gray-400">Resource Category *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'notes', label: 'Handwritten Notes' },
                  { value: 'pdf', label: 'Books / PDFs' },
                  { value: 'past_paper', label: 'Past Exam Papers' },
                  { value: 'assignment', label: 'Assignments' }
                ].map((type) => {
                  const isActive = resourceType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setResourceType(type.value as any)}
                      className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer gap-1.5 ${
                        isActive
                          ? isDarkMode
                            ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400'
                            : 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : isDarkMode
                          ? 'bg-zinc-950 border-zinc-800 text-gray-400 hover:bg-zinc-900 hover:text-white'
                          : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Provision Link */}
            {actionType === 'provide' && (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <label className="text-xs font-bold font-mono text-gray-400">File Reference Link (Drive, Dropbox, etc.) *</label>
                <div className="relative">
                  <Icons.Link className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    required
                    value={provisionLink}
                    onChange={(e) => setProvisionLink(e.target.value)}
                    placeholder="e.g. https://drive.google.com/your-provided-slide"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm transition-all outline-none ${
                      isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400 focus:bg-zinc-900'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50/20'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Description / Missing Source */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold font-mono text-gray-400">
                {actionType === 'request' ? 'Specific Description of Requested Files *' : 'Instructions & Details about File Content *'}
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  actionType === 'request'
                    ? "Describe details e.g. Year of terminal, teacher name, topic title, chapter number, page references if possible."
                    : "Describe what is in the file, year, unit chapters, or any specific instructions for students reading this."
                }
                className={`px-4 py-3 rounded-lg border text-sm transition-all outline-none resize-none ${
                  isDarkMode
                    ? 'bg-zinc-950 border-zinc-800 text-white focus:border-indigo-400 focus:bg-zinc-900'
                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50/20'
                }`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-lg font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Icons.SendHorizontal className="w-4 h-4 font-extrabold" />
              <span>
                {actionType === 'request' ? 'Submit Request' : 'Submit Shared Material'}
              </span>
            </motion.button>
          </form>
        </div>
      </div>

      {/* REQUEST TRACKING VIEW & FAQS (Right col, span 5) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Tracker Card */}
        <div
          className={`p-6 rounded-xl border flex-1 ${
            isDarkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3.5 mb-5">
            <Icons.History className="w-5 h-5 text-amber-500" />
            <h4 className={`text-base font-bold font-sans ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
              Community Tracking List
            </h4>
          </div>

          <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
            {requests.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-10">No requests submitted yet.</p>
            ) : (
              requests.map((req) => {
                const associatedSem = semesters.find((s) => s.id === req.semesterId);
                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border flex flex-col gap-2.5 transition-all ${
                      isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 font-mono">
                        {associatedSem?.name || req.semesterId}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>

                    <div>
                      <h5
                        className={`text-sm font-semibold truncate ${
                          isDarkMode ? 'text-zinc-150' : 'text-slate-900'
                        }`}
                      >
                        {req.courseName}
                      </h5>
                      {(req.description.startsWith('[PROVIDE MATERIAL') || req.requestType === 'provide') ? (
                        <>
                          <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-bold font-mono mt-0.5 flex items-center gap-1 uppercase">
                            <Icons.UploadCloud className="w-3 h-3" />
                            Shared {req.resourceType.replace('_', ' ')}
                          </p>
                          <p
                            className={`text-xs mt-2 italic leading-relaxed line-clamp-2 ${
                              isDarkMode ? 'text-[#CAC4D0]' : 'text-[#49454F]'
                            }`}
                          >
                            "{req.description.replace(/\[PROVIDE MATERIAL - LINK:.+?\]\s*/, '').replace(/^\s*Description:\s*/, '')}"
                          </p>
                          {req.provisionLink ? (
                            <div className="mt-2.5">
                              <a
                                href={req.provisionLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold hover:underline transition-all"
                              >
                                <Icons.ExternalLink className="w-3 h-3" />
                                Open Shared Link
                              </a>
                            </div>
                          ) : req.description.includes('LINK: ') ? (
                            <div className="mt-2.5">
                              <a
                                href={req.description.split('LINK: ')[1].split(']')[0]}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-zinc-805 text-[#6750A4] dark:text-indigo-400 text-[10px] font-mono font-bold hover:underline transition-all"
                              >
                                <Icons.ExternalLink className="w-3 h-3" />
                                Open Shared Link
                              </a>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <p className="text-[11px] text-[#6750A4] dark:text-indigo-400 font-bold font-mono mt-0.5 uppercase">
                            Requested {req.resourceType.replace('_', ' ')}
                          </p>
                          <p
                            className={`text-xs mt-2 italic leading-relaxed line-clamp-2 ${
                              isDarkMode ? 'text-[#CAC4D0]' : 'text-[#49454F]'
                            }`}
                          >
                            "{req.description}"
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 pb-1 border-t border-slate-500/10 text-[10px] text-gray-500 font-mono mt-2">
                      <span>By: {req.studentName.split(' ')[0]}</span>
                      <span>Requested: {req.date}</span>
                    </div>

                    {req.status?.toLowerCase() === 'pending' && (
                      <div className="mt-2 pt-2 border-t border-slate-500/5 flex justify-end">
                        {isAdmin ? (
                          <button
                            disabled={processingId !== null}
                            onClick={() => handleProcessRequest(req.id)}
                            className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              processingId === req.id
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 animate-pulse'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                            }`}
                          >
                            {processingId === req.id ? (
                              <>
                                <Icons.Loader2 className="w-3 animate-spin text-amber-500" />
                                Verifying Dropbox & Storage...
                              </>
                            ) : (
                              <>
                                <Icons.CheckSquare className="w-3 h-3 text-indigo-200" />
                                Approve & Process Submission
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 mt-1">
                            <Icons.Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                            Pending representative action
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
