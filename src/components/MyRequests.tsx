/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Semester, UserRequest } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface MyRequestsProps {
  semesters: Semester[];
  isDarkMode: boolean;
  currentUser: User | null;
  onOpenAuthModal?: () => void;
}

export default function MyRequests({ semesters, isDarkMode, currentUser, onOpenAuthModal }: MyRequestsProps) {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Synchronize student's personal requests in real-time
  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      // Construct robust query filtering by current user ID
      const q = query(
        collection(db, 'requests'),
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc'),
        limit(100)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: UserRequest[] = [];
        snapshot.forEach((snap) => {
          list.push(snap.data() as UserRequest);
        });
        setRequests(list);
        setLoading(false);
      }, (error) => {
        console.error('Error listening to personal requests: ', error);
        // Fallback: Query by user email if the composite index hasn't built yet
        const qByEmail = query(
          collection(db, 'requests'),
          where('email', '==', currentUser.email),
          orderBy('date', 'desc'),
          limit(100)
        );
        const unsubByEmail = onSnapshot(qByEmail, (emailSnap) => {
          const list: UserRequest[] = [];
          emailSnap.forEach((snap) => {
            list.push(snap.data() as UserRequest);
          });
          setRequests(list);
          setLoading(false);
        }, (err2) => {
          console.error('Email fallback requests query failed:', err2);
          setLoading(false);
        });
        return () => unsubByEmail();
      });

      return () => unsubscribe();
    } else {
      // Offline fallback: load from localStorage
      setLoading(true);
      const saved = localStorage.getItem('fuuast_cs_requests');
      if (saved) {
        try {
          const allRequests: UserRequest[] = JSON.parse(saved);
          // Filter out guest session requests and demo tracking requests
          const guestRequests = allRequests.filter(r => (r.userId === 'unregistered' || !r.userId) && !r.id.startsWith('req-default-'));
          setRequests(guestRequests);
        } catch (e) {
          console.error('Error parsing guest requests', e);
        }
      }
      setLoading(false);
    }
  }, [currentUser]);

  // Render proper colored status badge
  const getBadgeElement = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Approved
          </span>
        );
      case 'rejected':
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Rejected
          </span>
        );
      case 'fulfilled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Fulfilled
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        );
    }
  };

  return (
    <div id="my-requests-screen" className="w-full flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1">
        <h3 className={`text-xl font-black font-display tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          My Submitted Requests
        </h3>
        <p className="text-xs text-gray-400">
          Track active reviews, approved Dropbox links, or general fulfillment statuses of your curriculum requests.
        </p>
      </div>

      {/* Guest Notice */}
      {!currentUser && (
        <div className="p-5 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-3">
            <Icons.Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-indigo-850 dark:text-indigo-300">Synchronize Requests Live</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                You are currently viewing guest requests cached strictly in this browser. Register or sign in under a student account to pin requests securely in Firestore!
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer shadow-sm"
          >
            Log In / Sign Up
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Icons.Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
          <span className="text-xs text-gray-500 font-mono">Retrieving request records...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border text-gray-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-slate-50 border-slate-150'}`}>
          <Icons.FilePlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h4 className="text-sm font-semibold mb-1">No requests registered</h4>
          <p className="text-xs text-gray-480 max-w-sm mx-auto leading-relaxed">
            You haven't submitted any syllabus material or document requests yet. Switch to the <strong className="text-indigo-505 font-bold">Request Material</strong> tab to initiate one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => {
            const currentSemesterObj = semesters.find(s => s.id === req.semesterId);
            return (
              <div
                key={req.id}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-3 shadow-2xs transition-all ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-550/10 px-2 py-0.5 rounded tracking-wide">
                      {currentSemesterObj?.name || req.semesterId}
                    </span>
                    {getBadgeElement(req.status)}
                  </div>

                  <div>
                    <h4 className={`text-sm font-black ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {req.courseName}
                    </h4>
                    <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-mono mt-0.5 uppercase">
                      Category: <span className="font-semibold">{req.resourceType.split('_').join(' ')}</span>
                    </p>
                  </div>

                  {(req.description.startsWith('[PROVIDE MATERIAL') || req.requestType === 'provide') ? (
                    <div className="space-y-2">
                      <p className={`text-xs italic leading-relaxed line-clamp-3 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-950/40 text-indigo-300' : 'bg-indigo-50/50 text-slate-705'}`}>
                        &ldquo;{req.description.replace(/\[PROVIDE MATERIAL - LINK:.+?\]\s*/, '').replace(/^\s*Description:\s*/, '')}&rdquo;
                      </p>
                      {req.provisionLink ? (
                        <div className="pt-1">
                          <a
                            href={req.provisionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-mono font-bold text-amber-100 bg-amber-700 hover:bg-amber-600 rounded-md"
                          >
                            <Icons.ExternalLink className="w-3 h-3" />
                            View Contributed File
                          </a>
                        </div>
                      ) : req.description.includes('LINK: ') ? (
                        <div className="pt-1">
                          <a
                            href={req.description.split('LINK: ')[1].split(']')[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-mono font-bold text-amber-100 bg-amber-700 hover:bg-amber-600 rounded-md"
                          >
                            <Icons.ExternalLink className="w-3 h-3" />
                            View Contributed File
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className={`text-xs italic leading-relaxed line-clamp-3 p-3 rounded-lg ${isDarkMode ? 'bg-zinc-950/40 text-zinc-300' : 'bg-slate-50 text-slate-705'}`}>
                      &ldquo;{req.description}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-500/10 flex items-center justify-between text-2xs text-gray-400 font-mono">
                  <span>Owner: {req.studentName}</span>
                  <span>Date: {req.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
