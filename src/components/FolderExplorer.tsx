/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Semester, ResourceFolder, ResourceFile, FileType } from '../types';

interface FolderExplorerProps {
  semester: Semester;
  isDarkMode: boolean;
  bookmarkedIds: string[];
  onToggleBookmark: (fileId: string) => void;
  onBackToSemesters: () => void;
  onOpenFile: (file: ResourceFile) => void;
  isFavoriteSemester: boolean;
  onToggleFavoriteSemester: () => void;
  favoriteFileIds: string[];
  onToggleFavoriteFile: (fileId: string) => void;
}

export default function FolderExplorer({
  semester,
  isDarkMode,
  bookmarkedIds,
  onToggleBookmark,
  onBackToSemesters,
  onOpenFile,
  isFavoriteSemester,
  onToggleFavoriteSemester,
  favoriteFileIds,
  onToggleFavoriteFile
}: FolderExplorerProps) {
  // Navigation stack: stores the folders from current path
  // E.g. level 0: subjects of semester, level 1: subfolder of subject, level 2: nested files/folders
  const [navigationStack, setNavigationStack] = useState<ResourceFolder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Trigger brief simulation of loading when navigation changes (feels like Dropbox fetching)
  const triggerLoading = (action: () => void) => {
    setIsLoading(true);
    const delay = setTimeout(() => {
      action();
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(delay);
  };

  // Safe navigation helpers
  const handleSelectSubject = (subject: ResourceFolder) => {
    if (subject.directUrl) {
      window.open(subject.directUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    triggerLoading(() => {
      setNavigationStack([subject]);
    });
  };

  const handleSelectSubfolder = (folder: ResourceFolder) => {
    triggerLoading(() => {
      setNavigationStack((prev) => [...prev, folder]);
    });
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      // Return to semester subject list
      triggerLoading(() => {
        setNavigationStack([]);
      });
    } else {
      // Slice stack to specific index
      triggerLoading(() => {
        setNavigationStack((prev) => prev.slice(0, index + 1));
      });
    }
  };

  const currentFolder = navigationStack.length > 0 ? navigationStack[navigationStack.length - 1] : null;

  // Resolve file icon based on type
  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return <Icons.FileText className="w-5 h-5 text-[#B3261E]" />;
      case 'zip':
        return <Icons.FileArchive className="w-5 h-5 text-[#E65100]" />;
      case 'word':
        return <Icons.FileCode className="w-5 h-5 text-[#0A58CA]" />;
      case 'slides':
        return <Icons.Video className="w-5 h-5 text-[#F57C00]" />;
      case 'link':
        return <Icons.Link className="w-5 h-5 text-[#0D6EFD]" />;
      default:
        return <Icons.File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div id="folder-explorer-root" className="w-full flex flex-col min-h-[500px]">
      {/* 1. Explorer Header and Semester Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-dashed border-slate-200 dark:border-zinc-805">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToSemesters}
            className={`p-3 rounded-xl transition-colors flex items-center justify-center ${
              isDarkMode
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-slate-150 text-slate-700 hover:bg-slate-200'
            }`}
            title="Back to Semester Grid"
          >
            <Icons.ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  isDarkMode ? 'bg-zinc-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                Computer Science
              </span>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs text-gray-400">Resource Portal</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h2
                className={`text-xl font-sans font-extrabold tracking-tight ${
                  isDarkMode ? 'text-zinc-100' : 'text-slate-900'
                }`}
              >
                {semester.fullName}
              </h2>
              <button
                onClick={onToggleFavoriteSemester}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isFavoriteSemester
                    ? 'bg-rose-500/10 text-rose-500'
                    : 'hover:bg-rose-500/10 text-gray-400 hover:text-rose-500'
                }`}
                title={isFavoriteSemester ? 'Remove from Favorites' : 'Add to Favorites'}
              >
                <Icons.Heart className={`w-4 h-4 ${isFavoriteSemester ? 'fill-rose-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Current Path Indicator */}
        <div className="text-xs text-gray-500 font-mono">
          Items Available:{' '}
          <span className="font-bold text-amber-500">
            {currentFolder
              ? (currentFolder.files?.length || 0) + (currentFolder.folders?.length || 0)
              : semester.subjects.length}
          </span>
        </div>
      </div>

      {/* 2. Sleek Breadcrumb Bar (Responsive) */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide text-sm border ${
          isDarkMode
            ? 'bg-zinc-900 border-zinc-800 text-zinc-400'
            : 'bg-slate-50 border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <Icons.FolderClosed className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <button
          onClick={() => handleNavigateBreadcrumb(-1)}
          className={`hover:underline cursor-pointer font-medium ${
            navigationStack.length === 0 ? 'text-indigo-600 font-bold dark:text-indigo-400' : ''
          }`}
        >
          {semester.name}
        </button>

        {navigationStack.map((folder, index) => {
          const isLast = index === navigationStack.length - 1;
          return (
            <div key={folder.id} className="flex items-center gap-2">
              <Icons.ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <button
                disabled={isLast}
                onClick={() => handleNavigateBreadcrumb(index)}
                className={`hover:underline cursor-pointer max-w-[150px] truncate ${
                  isLast ? 'text-indigo-600 dark:text-indigo-400 font-bold cursor-default' : 'font-medium'
                }`}
              >
                {folder.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* 3. Material Loading Spinner */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-20">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-500/10 rounded-full" />
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-xs font-mono text-gray-500 mt-4 tracking-wider">
            SYNCHRONIZING REPOSITORY...
          </span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFolder ? currentFolder.id : 'subjects-list'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* LEVEL 0: Subject List */}
            {navigationStack.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {semester.subjects.map((subject) => {
                  const subjectFilesCount = subject.folders
                    ? subject.folders.reduce(
                        (acc, fold) => acc + (fold.files?.length || 0),
                        0
                      )
                    : 0;
                  const isFolderFavorited = favoriteFileIds.includes(subject.id);

                  return (
                    <motion.div
                      id={`subject-item-${subject.id}`}
                      key={subject.id}
                      whileHover={{ scale: 1.012, y: -3 }}
                      whileTap={{ scale: 0.985 }}
                      className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between ${
                        isDarkMode
                          ? 'bg-zinc-900 hover:bg-zinc-805 border-zinc-800 shadow-md'
                          : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div 
                          onClick={() => handleSelectSubject(subject)}
                          className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className={`p-3 rounded-lg ${
                            subject.directUrl
                              ? (subject.externalType === 'folder'
                                  ? 'bg-amber-500/10 text-amber-500'
                                  : 'bg-red-500/10 text-red-500')
                              : 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {subject.directUrl ? (
                              subject.externalType === 'folder' ? (
                                <Icons.FolderClosed className="w-5 h-5 fill-amber-500/10" />
                              ) : (
                                <Icons.FileText className="w-5 h-5" />
                              )
                            ) : (
                              <Icons.GraduationCap className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4
                              className={`text-base font-bold truncate ${
                                isDarkMode ? 'text-zinc-100' : 'text-slate-900'
                              }`}
                            >
                              {subject.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {subject.description || 'Access notes, PDFs, assignments and past papers.'}
                            </p>

                            {subject.directUrl && (
                              <div className="flex items-center gap-1.5 mt-2.5">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide uppercase inline-flex items-center gap-1 ${
                                  subject.externalType === 'folder'
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'bg-indigo-55 bg-indigo-50 dark:bg-zinc-805 text-indigo-650 dark:text-indigo-400'
                                }`}>
                                  {subject.externalType === 'folder' ? 'Dropbox Folder' : 'Direct PDF'}
                                  <Icons.ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subject Folder Favorite Heart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavoriteFile(subject.id);
                          }}
                          className={`p-2 rounded-xl transition-all border cursor-pointer shrink-0 hover:scale-105 active:scale-95 ${
                            isFolderFavorited
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                              : isDarkMode
                              ? 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-rose-500'
                              : 'bg-white border-slate-200 text-gray-400 hover:text-rose-500'
                          }`}
                          title={isFolderFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                        >
                          <Icons.Heart className={`w-4 h-4 ${isFolderFavorited ? 'fill-rose-500 stroke-rose-500' : ''}`} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* LEVEL 1+: Subfolders and Files Grid */}
            {currentFolder && (
              <div className="flex flex-col gap-6">
                {/* A. Folder section */}
                {currentFolder.folders && currentFolder.folders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase font-mono mb-3">
                      Subfolders / Categories
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentFolder.folders.map((fold) => {
                        const isSubfavorited = favoriteFileIds.includes(fold.id);
                        return (
                          <div
                            id={`subfolder-item-${fold.id}`}
                            key={fold.id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all gap-2 ${
                              isDarkMode
                                ? 'bg-zinc-900 border-zinc-800'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div 
                              onClick={() => handleSelectSubfolder(fold)}
                              className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                <Icons.FolderClosed className="w-5 h-5 fill-amber-500/20" />
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div
                                  className={`text-sm font-bold truncate ${
                                    isDarkMode ? 'text-zinc-100' : 'text-slate-900'
                                  }`}
                                >
                                  {fold.name}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                  {fold.files?.length || 0} items inside
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Subfolder favorite option */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavoriteFile(fold.id);
                                }}
                                className={`p-2 rounded-lg transition-all border cursor-pointer hover:scale-105 active:scale-95 ${
                                  isSubfavorited
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                    : isDarkMode
                                    ? 'bg-zinc-950 border-zinc-800/80 text-gray-400 hover:text-rose-500'
                                    : 'bg-slate-50 border-slate-100 text-gray-400 hover:text-rose-500'
                                }`}
                                title={isSubfavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                              >
                                <Icons.Heart className={`w-3.5 h-3.5 ${isSubfavorited ? 'fill-rose-500 stroke-rose-500' : ''}`} />
                              </button>

                              <div onClick={() => handleSelectSubfolder(fold)} className="text-gray-400 hover:text-slate-600 dark:hover:text-white p-1.5 cursor-pointer">
                                <Icons.ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}                {/* B. Files Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase font-mono">
                      Resources & Attachments
                    </h4>
                    {currentFolder.files && currentFolder.files.length > 0 && (
                      <span className="text-[11px] text-gray-500">
                        Total {currentFolder.files.length} items
                      </span>
                    )}
                  </div>

                  {!currentFolder.files || currentFolder.files.length === 0 ? (
                    <div
                      className={`text-center py-12 rounded-xl border border-dashed flex flex-col items-center justify-center ${
                        isDarkMode
                          ? 'border-zinc-800 bg-zinc-950/40 text-zinc-400'
                          : 'border-slate-205 bg-slate-50/50 text-slate-500'
                      }`}
                    >
                      <Icons.FolderOpen className="w-10 h-10 text-zinc-500 stroke-[1.5] mb-2" />
                      <p className="text-sm font-bold">This folder is empty</p>
                      <p className="text-xs text-gray-400 mt-1 px-4 text-center">
                        Lecturer files have not been uploaded here yet. Tap "Request Resource" above to raise a request!
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {currentFolder.files.map((file) => {
                        const isBookmarked = bookmarkedIds.includes(file.id);
                        const isFavorited = favoriteFileIds.includes(file.id);
                        return (
                          <div
                            id={`file-item-${file.id}`}
                            key={file.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                              isDarkMode
                                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850'
                                : 'bg-white border-slate-200 hover:bg-slate-50/50 shadow-sm'
                            }`}
                          >
                            {/* File description line */}
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              <div className="mt-0.5 p-1.5 bg-gray-500/10 rounded-lg shrink-0">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5
                                  onClick={() => onOpenFile(file)}
                                  className={`text-sm font-bold hover:underline cursor-pointer transition-all line-clamp-1 ${
                                    isDarkMode ? 'text-zinc-100' : 'text-slate-900'
                                  }`}
                                  title={file.name}
                                >
                                  {file.name}
                                </h5>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-mono mt-1">
                                  <span className="px-1.5 py-0.5 uppercase bg-indigo-50 dark:bg-zinc-805 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">
                                    {file.type}
                                  </span>
                                  <span>•</span>
                                  <span>{file.size}</span>
                                  <span>•</span>
                                  <span>Uploaded: {file.addedDate}</span>
                                </div>
                              </div>
                            </div>

                            {/* Favorite / Download File options */}
                            <div className="flex items-center gap-2 sm:self-center shrink-0 justify-end">
                              {/* Favorite option */}
                              <button
                                onClick={() => onToggleFavoriteFile(file.id)}
                                className={`p-2.5 rounded-xl transition-all border cursor-pointer hover:scale-105 active:scale-95 ${
                                  isFavorited
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                                    : isDarkMode
                                    ? 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-rose-500'
                                    : 'bg-white border-slate-200 text-gray-400 hover:text-rose-500'
                                }`}
                                title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                              >
                                <Icons.Heart
                                  className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 stroke-rose-500' : ''}`}
                                />
                              </button>

                              {/* Download button */}
                              <button
                                onClick={() => onOpenFile(file)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                              >
                                <Icons.ExternalLink className="w-3.5 h-3.5" />
                                <span>Get Link</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
