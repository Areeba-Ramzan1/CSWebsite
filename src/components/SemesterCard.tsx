/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Semester, ResourceFolder } from '../types';
import { getAllFiles } from '../data';

interface SemesterCardProps {
  key?: string;
  semester: Semester;
  onClick: () => void;
  isDarkMode: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  progress?: number;
}

export default function SemesterCard({ semester, onClick, isDarkMode, isFavorite, onToggleFavorite, progress }: SemesterCardProps) {
  // Dynamically resolve the icon
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Icons.Layers className="w-6 h-6" />;
      case 'Terminal': return <Icons.Terminal className="w-6 h-6" />;
      case 'Cpu': return <Icons.Cpu className="w-6 h-6" />;
      case 'Database': return <Icons.Database className="w-6 h-6" />;
      case 'Network': return <Icons.Network className="w-6 h-6" />;
      case 'ShieldAlert': return <Icons.ShieldAlert className="w-6 h-6" />;
      case 'FolderKanban': return <Icons.FolderKanban className="w-6 h-6" />;
      default: return <Icons.BookOpen className="w-6 h-6" />;
    }
  };

  // Calculate stats
  const totalSubjects = semester.subjects.length;
  let totalFilesCount = 0;
  semester.subjects.forEach((subj: ResourceFolder) => {
    totalFilesCount += getAllFiles(subj).length;
  });

  // Get customized file counts requested by user
  const getCustomFileCount = (id: string) => {
    switch (id) {
      case 'sem1': return 8;
      case 'sem2': return 23;
      case 'sem3': return 7;
      case 'sem4': return 30;
      case 'sem5': return 13;
      case 'sem6': return 8;
      case 'sem7': return 29;
      case 'sem8': return 20;
      default: return totalFilesCount;
    }
  };

  return (
    <motion.div
      id={`semester-card-${semester.id}`}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer rounded-xl p-6 transition-all duration-300 flex flex-col justify-between h-[235px] ${
        isDarkMode
          ? 'bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 shadow-md'
          : 'bg-white hover:bg-slate-50/50 border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
      }`}
    >
      {/* Dynamic Background soft gradient overlay depending on theme */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${semester.color}`} />

      <div>
        {/* Header line with icon */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div
            className={`p-3 rounded-lg ${
              isDarkMode
                ? 'bg-zinc-800 text-indigo-400'
                : 'bg-indigo-55 bg-indigo-50 text-indigo-700'
            }`}
          >
            {getIcon(semester.icon)}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(e);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'hover:bg-amber-500/10 text-gray-400 hover:text-amber-500'
              }`}
              title={isFavorite ? 'Remove from Bookmarks' : 'Add to Bookmarks'}
            >
              <Icons.Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
            </button>

            <span
              className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full ${
                isDarkMode
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-slate-100 text-slate-605 text-slate-600'
              }`}
            >
              CS Portal
            </span>
          </div>
        </div>

        {/* Semester name and details */}
        <h3
          className={`text-lg font-sans font-bold tracking-tight mb-1 transition-colors ${
            isDarkMode ? 'text-zinc-100' : 'text-slate-900'
          }`}
        >
          {semester.name}
        </h3>
        <p
          className={`text-xs line-clamp-2 leading-relaxed ${
            isDarkMode ? 'text-zinc-400' : 'text-slate-600'
          }`}
        >
          {semester.description}
        </p>
      </div>

      {/* Footer stats list */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono font-medium text-gray-500 relative z-10">
        <span className="flex items-center gap-1.5">
          <Icons.BookOpen className="w-3.5 h-3.5" />
          {totalSubjects} {totalSubjects === 1 ? 'Subject' : 'Subjects'}
        </span>
        <span className="flex items-center gap-1.5 font-sans text-xs">
          <Icons.FileText className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-[11px] font-medium">{getCustomFileCount(semester.id)} Files</span>
        </span>
      </div>

    </motion.div>
  );
}
