/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Semester, UserRequest } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AdminNotificationItem {
  id: string;
  studentName: string;
  email: string;
  semesterId: string;
  courseName: string;
  resourceType: string;
  description: string;
  date: string;
  createdAt: string;
  read: boolean;
}

interface AdminPanelProps {
  semesters: Semester[];
  isDarkMode: boolean;
  currentUser: User | null;
}

export default function AdminPanel({ semesters, isDarkMode, currentUser }: AdminPanelProps) {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [activeSegment, setActiveSegment] = useState<'requests' | 'notifications'>('requests');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'request' | 'provide'>('all');

  const isAdmin = currentUser?.email === 'ramzanareeba70@gmail.com';

  // Read requests and notifications from Firestore in real-time
  useEffect(() => {
    if (!isAdmin) return;

    // 1. Live stream requests sorted such that Pending / Newest items appear first
    const qRequests = query(collection(db, 'requests'), orderBy('date', 'desc'), limit(150));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      const list: UserRequest[] = [];
      snapshot.forEach((snap) => {
        list.push(snap.data() as UserRequest);
      });
      
      // Secondary sorting to keep "Pending" at the very top, then sorted by date
      const sorted = [...list].sort((a, b) => {
        const aPending = a.status?.toLowerCase() === 'pending' ? 1 : 0;
        const bPending = b.status?.toLowerCase() === 'pending' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setRequests(sorted);
    }, (err) => {
      console.error('Admin Firestore requests stream error:', err);
    });

    // 2. Live stream Admin Notifications
    const qNotifs = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const list: AdminNotificationItem[] = [];
      snapshot.forEach((snap) => {
        list.push(snap.data() as AdminNotificationItem);
      });
      setNotifications(list);
    }, (err) => {
      console.error('Admin Firestore notifications stream error:', err);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeNotifs();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-950/20 text-red-600 rounded-full mb-4">
          <Icons.ShieldAlert className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md">
          Only the academic block coordinator (ramzanareeba70@gmail.com) is authorized to view or manage the Material Request Dashboard.
        </p>
      </div>
    );
  }

  // Handle Approve status change
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'requests', id), { status: 'Approved' });
      setSuccessMessage('Request approved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject status change
  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'requests', id), { status: 'Rejected' });
      setSuccessMessage('Request marked as Rejected.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Mark as Fulfilled status change
  const handleFulfill = async (id: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'requests', id), { status: 'Fulfilled' });
      setSuccessMessage('Request marked as Fulfilled!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle arbitrary status update from dropdown
  const handleStatusChange = async (id: string, newStatus: string) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, 'requests', id), { status: newStatus });
      setSuccessMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `requests/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Delete Request
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this resource request permanently? This action cannot be undone.')) {
      return;
    }
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, 'requests', id));
      setSuccessMessage('Material request permanently deleted.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `requests/${id}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Mark single notification as read
  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'admin_notifications', notifId), { read: true });
    } catch (err) {
      console.error('Failed to update notification state:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotifsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      for (const n of unread) {
        await updateDoc(doc(db, 'admin_notifications', n.id), { read: true });
      }
      setSuccessMessage('All notifications marked as read.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const detectedType = req.requestType || (req.description.includes('PROVIDE MATERIAL') ? 'provide' : 'request');
    const matchesType = typeFilter === 'all' || detectedType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingRequestsCount = requests.filter(r => r.status?.toLowerCase() === 'pending').length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Render proper colored badge
  const getBadgeElement = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'rejected':
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Fulfilled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
    }
  };

  return (
    <div id="admin-panel" className="w-full flex flex-col gap-6 font-sans">
      {/* POPUP NOTIFICATION ALERTS */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm font-semibold border border-white/10"
          >
            <Icons.CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-xs">{successMessage}</p>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-rose-600 text-white rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm font-semibold border border-rose-500/30"
          >
            <Icons.AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD HERO STATS COUNTER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Admin Requests */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Total Requests</span>
            <div className="p-2 bg-indigo-50 dark:bg-zinc-800 text-indigo-500 rounded-lg">
              <Icons.FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{requests.length}</span>
            <span className="text-[10px] text-gray-500 font-mono">records in system</span>
          </div>
        </div>

        {/* Card 2: Pending Action Request Block */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Pending Review</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Icons.Clock className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${pendingRequestsCount > 0 ? 'text-amber-500' : ''}`}>
              {pendingRequestsCount}
            </span>
            {pendingRequestsCount > 0 && (
              <span className="text-[9px] bg-amber-500/15 text-amber-500 font-bold px-1.5 py-0.5 rounded-md font-mono shrink-0 animate-pulse">
                Needs Attention
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Approved requests */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Total Approved</span>
            <div className="p-2 bg-emerald-50 dark:bg-zinc-800 text-emerald-500 rounded-lg">
              <Icons.CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500">
              {requests.filter(r => r.status?.toLowerCase() === 'approved').length}
            </span>
            <span className="text-[10px] text-gray-550 font-mono">active syncs</span>
          </div>
        </div>

        {/* Card 4: Unread Notifications count */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold font-mono text-gray-400 uppercase">Alert Inbox</span>
            <div className={`p-2 rounded-lg ${unreadNotificationsCount > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-50 dark:bg-zinc-805 text-zinc-400'}`}>
              <Icons.Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${unreadNotificationsCount > 0 ? 'text-rose-500' : ''}`}>
              {unreadNotificationsCount}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">new alerts</span>
          </div>
        </div>
      </div>

      {/* SEGMENT TOGGLE NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-500/10 pb-4">
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850">
          <button
            onClick={() => setActiveSegment('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSegment === 'requests'
                ? 'bg-indigo-650 text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icons.Layers className="w-3.5 h-3.5" />
            Requests Management ({filteredRequests.length})
          </button>
          <button
            onClick={() => setActiveSegment('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
              activeSegment === 'notifications'
                ? 'bg-indigo-650 text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Icons.Inbox className="w-3.5 h-3.5" />
            Submission Notifications
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1 text-[8px] bg-red-500 text-white font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {activeSegment === 'notifications' && unreadNotificationsCount > 0 && (
          <button
            onClick={handleMarkAllNotifsRead}
            className="flex items-center gap-1 text-[11px] font-mono hover:underline font-bold text-indigo-500 cursor-pointer"
          >
            <Icons.CheckCheck className="w-3.5 h-3.5" />
            Clear All Alerts
          </button>
        )}
      </div>

      {/* MAIN RENDER PANEL */}
      <AnimatePresence mode="wait">
        {activeSegment === 'requests' ? (
          <motion.div
            key="requests-segment"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex flex-col gap-4"
          >
            {/* Search and filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Icons.Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter requests by topic, student name, email, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-zinc-900 border-zinc-800 text-white focus:bg-zinc-950 focus:border-indigo-400'
                      : 'bg-white border-slate-205 text-slate-900 focus:border-indigo-600'
                  }`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border text-xs outline-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-zinc-900 border-zinc-800 text-white'
                    : 'bg-white border-slate-205 text-slate-800'
                }`}
              >
                <option value="all">All Request Statuses</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved Only</option>
                <option value="rejected">Rejected Only</option>
                <option value="fulfilled">Fulfilled Only</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className={`px-4 py-2.5 rounded-xl border text-xs outline-none cursor-pointer ${
                  isDarkMode
                    ? 'bg-zinc-900 border-zinc-800 text-white'
                    : 'bg-white border-slate-205 text-slate-800'
                }`}
              >
                <option value="all">All Submission Types</option>
                <option value="request">Requests Only</option>
                <option value="provide">Contributions (Provide Link) Only</option>
              </select>
            </div>

            {/* Requests List */}
            <div className="flex flex-col gap-4">
              {filteredRequests.length === 0 ? (
                <div className={`p-12 text-center rounded-2xl border text-gray-500 ${isDarkMode ? 'bg-zinc-905 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                  <Icons.SearchX className="w-10 h-10 mx-auto text-gray-400 mb-2.5" />
                  <p className="text-xs font-mono">No material requests found matching criteria.</p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const currentSemesterObj = semesters.find(s => s.id === req.semesterId);
                  return (
                    <div
                      key={req.id}
                      className={`p-5 rounded-2xl border flex flex-col gap-4 shadow-sm transition-all ${
                        req.status?.toLowerCase() === 'pending'
                          ? 'border-amber-500/40 bg-amber-500/[0.02]'
                          : isDarkMode
                          ? 'bg-zinc-900 border-zinc-805'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Top metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-500/10">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono uppercase bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded">
                            {currentSemesterObj?.name || req.semesterId}
                          </span>
                          <span className="text-2xs text-gray-400 font-mono">
                            ID: {req.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getBadgeElement(req.status)}
                          <span className="text-[10px] font-mono text-gray-400">
                            Submitted: {req.date}
                          </span>
                        </div>
                      </div>

                      {/* Student info & Request core */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 flex flex-col gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="text-sm font-black text-indigo-650 dark:text-indigo-400">
                                {req.courseName}
                              </h4>
                              {(req.requestType === 'provide' || req.description.includes('PROVIDE MATERIAL')) ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Icons.Share2 className="w-3 h-3" />
                                  Contribution (Provided Link)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  <Icons.HelpCircle className="w-3 h-3" />
                                  Requested Material
                                </span>
                              )}
                            </div>
                            <p className="text-2xs text-gray-400 font-mono uppercase">
                              Category: <span className="font-bold">{req.resourceType.replace('_', ' ')}</span>
                            </p>
                          </div>

                          <div className={`p-3.5 rounded-xl text-xs font-normal border italic ${isDarkMode ? 'bg-zinc-950/50 border-zinc-805/40 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                            &ldquo;{req.description}&rdquo;
                          </div>

                          {(req.requestType === 'provide' || req.description.includes('PROVIDE MATERIAL')) && (
                            <div className="mt-2">
                              {req.provisionLink ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold font-mono text-gray-400 uppercase">Shared Resource Link:</span>
                                  <a
                                    href={req.provisionLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-750 transition-all w-max shadow-sm"
                                  >
                                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                                    Open Provided Link
                                  </a>
                                </div>
                              ) : (
                                <p className="text-xs font-mono text-amber-500">
                                  * Note: This contribution contains a shared link within the description.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submitted by details card */}
                        <div className={`md:col-span-4 p-3.5 rounded-xl border flex flex-col gap-1.5 ${isDarkMode ? 'bg-zinc-950/30 border-zinc-805' : 'bg-slate-50/50 border-slate-105'}`}>
                          <h5 className="text-[9px] font-black font-mono text-gray-400 uppercase tracking-widest">
                            Student Metadata
                          </h5>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold leading-tight">{req.studentName}</p>
                            <a
                              href={`mailto:${req.email}`}
                              className="text-[10px] font-mono text-indigo-500 hover:underline flex items-center gap-1 leading-none"
                            >
                              <Icons.Mail className="w-3 h-3 shrink-0" />
                              {req.email}
                            </a>
                            <p className="text-[10px] font-mono text-zinc-400 mt-1 leading-none">
                              Uid: {req.userId || 'Guest Session'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Admin Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-slate-500/10">
                        {/* Status override dropdown selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold font-mono text-gray-400 uppercase">
                            Status Override:
                          </label>
                          <select
                            disabled={processingId !== null}
                            value={req.status}
                            onChange={(e) => handleStatusChange(req.id, e.target.value)}
                            className={`px-2.5 py-1 rounded text-xs font-semibold outline-none cursor-pointer border ${
                              isDarkMode
                                ? 'bg-zinc-950 border-zinc-800 text-white'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Fulfilled">Fulfilled</option>
                          </select>
                        </div>

                        {/* Approve, Reject, Fulfill, Delete explicit buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            disabled={processingId !== null}
                            onClick={() => handleApprove(req.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                            title="Set status to Approved"
                          >
                            <Icons.Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            disabled={processingId !== null}
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                            title="Set status to Rejected"
                          >
                            <Icons.XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            disabled={processingId !== null}
                            onClick={() => handleFulfill(req.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                            title="Set status to Fulfilled"
                          >
                            <Icons.Award className="w-3.5 h-3.5" />
                            <span>Fulfilled</span>
                          </button>

                          <button
                            disabled={processingId !== null}
                            onClick={() => handleDelete(req.id)}
                            className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-red-600 dark:hover:bg-red-650 hover:text-white text-zinc-700 dark:text-zinc-200 text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            title="Permanently remove request from database"
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="notifications-segment"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="flex flex-col gap-4"
          >
            {/* Live alerts inbox rendering */}
            <div className="flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className={`p-12 text-center rounded-2xl border text-gray-500 ${isDarkMode ? 'bg-zinc-905 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                  <Icons.Inbox className="w-10 h-10 mx-auto text-gray-400 mb-2.5" />
                  <p className="text-xs font-mono">Real-time alert inbox is empty. No notifications generated.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  return (
                    <motion.div
                      layout
                      key={notif.id}
                      onClick={() => !notif.read && handleMarkNotifRead(notif.id)}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all duration-250 cursor-pointer ${
                        !notif.read
                          ? 'border-indigo-500 bg-indigo-500/[0.03] shadow-sm'
                          : isDarkMode
                          ? 'bg-zinc-900/60 border-zinc-805/80 text-zinc-400'
                          : 'bg-slate-50/50 border-slate-105 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                          <span className={`text-xs font-black font-mono tracking-wide ${!notif.read ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
                            {notif.semesterId}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-450">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="space-y-1 mt-1">
                        <h4 className={`text-sm font-semibold leading-tight ${!notif.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-550'}`}>
                          New Request for: <span className="font-extrabold">{notif.courseName}</span>
                        </h4>
                        <p className="text-xs leading-relaxed max-w-2xl font-normal">
                          {notif.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-500/5 text-[10px] font-mono mt-2 text-zinc-450">
                        <span>Submitted By: {notif.studentName} ({notif.email})</span>
                        <span>Date: {notif.date}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
