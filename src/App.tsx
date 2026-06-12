/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { INITIAL_SEMESTERS, searchAllSemesters, getAllFiles, GlobalSearchResult } from './data';
import { Semester, ResourceFile, ResourceFolder, RecentlyViewedItem, ContinueReadingItem } from './types';
import SemesterCard from './components/SemesterCard';
import FolderExplorer from './components/FolderExplorer';
import RequestResourceForm from './components/RequestResourceForm';
import AuthModal from './components/AuthModal';
import PDFReaderModal from './components/PDFReaderModal';

// Firebase Sync Infrastructure
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export default function App() {
  // 1. Core Reactive States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('fuuast_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'bookmarks' | 'favorites' | 'requests' | 'about'>('home');
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [folderNavigationStack, setFolderNavigationStack] = useState<ResourceFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Bookmarking System for Files & Folders
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fuuast_bookmark_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Favorite System for Semesters
  const [favoriteSemesterIds, setFavoriteSemesterIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fuuast_favorite_semesters');
    return saved ? JSON.parse(saved) : [];
  });

  // Favorite System for Files
  const [favoriteFileIds, setFavoriteFileIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('fuuast_favorite_file_ids');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulated Dropbox Opening Modal State
  const [cloudLoadingFile, setCloudLoadingFile] = useState<ResourceFile | null>(null);
  const [cloudConnectStep, setCloudConnectStep] = useState<number>(0);

  // Mobile menu bar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Time display
  const [currentTime, setCurrentTime] = useState<string>('');

  // Study Progress Tracker maps
  const [subjectProgress, setSubjectProgress] = useState<Record<string, 'Not Started' | 'In Progress' | 'Completed'>>(() => {
    const saved = localStorage.getItem('fuuast_subject_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Recently Viewed tracker
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(() => {
    const saved = localStorage.getItem('fuuast_cs_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  // Continue Reading tracker
  const [continueReading, setContinueReading] = useState<ContinueReadingItem[]>(() => {
    const saved = localStorage.getItem('fuuast_cs_continue_reading');
    return saved ? JSON.parse(saved) : [];
  });

  // E-Reader Module Active Viewer state
  const [activeReadingFile, setActiveReadingFile] = useState<ResourceFile | null>(null);
  const [activeReadingSubjectName, setActiveReadingSubjectName] = useState<string>('');

  // Firebase auth & live databases listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      // 0. Migrate any offline-saved bookmarks/favorites immediately to user's secure Firestore profile
      const migrateLocalDataToFirestore = async () => {
        try {
          const savedBookmarked = localStorage.getItem('fuuast_bookmark_ids');
          const localBookmarks: string[] = savedBookmarked ? JSON.parse(savedBookmarked) : [];

          const savedSemesters = localStorage.getItem('fuuast_favorite_semesters');
          const localSemesters: string[] = savedSemesters ? JSON.parse(savedSemesters) : [];

          const savedFiles = localStorage.getItem('fuuast_favorite_file_ids');
          const localFiles: string[] = savedFiles ? JSON.parse(savedFiles) : [];

          const savedProgress = localStorage.getItem('fuuast_subject_progress');
          const localProgress: Record<string, 'Not Started' | 'In Progress' | 'Completed'> = savedProgress ? JSON.parse(savedProgress) : {};

          const savedContinue = localStorage.getItem('fuuast_cs_continue_reading');
          const localContinue: ContinueReadingItem[] = savedContinue ? JSON.parse(savedContinue) : [];

          // Migrate Bookmarks
          for (const id of localBookmarks) {
            const ref = doc(db, 'users', currentUser.uid, 'bookmarks', id);
            await setDoc(ref, { fileId: id, createdAt: new Date().toISOString() });
          }

          // Migrate Favorite Semesters
          for (const semId of localSemesters) {
            const ref = doc(db, 'users', currentUser.uid, 'favoriteSemesters', semId);
            await setDoc(ref, { semesterId: semId, createdAt: new Date().toISOString() });
          }

          // Migrate Favorite Files
          for (const fileId of localFiles) {
            const ref = doc(db, 'users', currentUser.uid, 'favoriteFiles', fileId);
            await setDoc(ref, { fileId: fileId, createdAt: new Date().toISOString() });
          }

          // Migrate Subject Progress
          for (const [subjId, status] of Object.entries(localProgress)) {
            const ref = doc(db, 'users', currentUser.uid, 'progress', subjId);
            await setDoc(ref, { subjectId: subjId, status, updatedAt: new Date().toISOString() });
          }

          // Migrate Continue Reading items
          for (const item of localContinue) {
            const ref = doc(db, 'users', currentUser.uid, 'continueReading', item.fileId);
            await setDoc(ref, item);
          }

          // Clear migrated items so they don't sync again recursively or clash
          localStorage.removeItem('fuuast_bookmark_ids');
          localStorage.removeItem('fuuast_favorite_semesters');
          localStorage.removeItem('fuuast_favorite_file_ids');
          localStorage.removeItem('fuuast_subject_progress');
          localStorage.removeItem('fuuast_cs_continue_reading');
        } catch (err) {
          console.error('Failed to migrate local user bookmarks to Cloud Firestore: ', err);
        }
      };

      migrateLocalDataToFirestore();

      // 1. Synchronize Bookmarks Collection
      const unsubBookmarks = onSnapshot(collection(db, 'users', currentUser.uid, 'bookmarks'), (snap) => {
        const ids: string[] = [];
        snap.forEach((docSnap) => ids.push(docSnap.id));
        setBookmarkedIds(ids);
      }, (error) => console.error('Firestore bookmarks list subscription error: ', error));

      // 2. Synchronize Favorite Semesters
      const unsubSemesters = onSnapshot(collection(db, 'users', currentUser.uid, 'favoriteSemesters'), (snap) => {
        const ids: string[] = [];
        snap.forEach((docSnap) => ids.push(docSnap.id));
        setFavoriteSemesterIds(ids);
      }, (error) => console.error('Firestore favorite semesters subscripton error: ', error));

      // 3. Synchronize Favorite Files
      const unsubFiles = onSnapshot(collection(db, 'users', currentUser.uid, 'favoriteFiles'), (snap) => {
        const ids: string[] = [];
        snap.forEach((docSnap) => ids.push(docSnap.id));
        setFavoriteFileIds(ids);
      }, (error) => console.error('Firestore favorite files subscripton error: ', error));

      // 4. Synchronize Subject Progress Collection
      const unsubProgress = onSnapshot(collection(db, 'users', currentUser.uid, 'progress'), (snap) => {
        const prog: Record<string, 'Not Started' | 'In Progress' | 'Completed'> = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.status) {
            prog[docSnap.id] = data.status;
          }
        });
        setSubjectProgress(prog);
        localStorage.setItem('fuuast_subject_progress', JSON.stringify(prog));
      }, (error) => console.error('Firestore study progress subscription error: ', error));

      // 5. Synchronize Continue Reading Collection
      const unsubContinueReading = onSnapshot(collection(db, 'users', currentUser.uid, 'continueReading'), (snap) => {
        const items: ContinueReadingItem[] = [];
        snap.forEach((docSnap) => {
          items.push(docSnap.data() as ContinueReadingItem);
        });
        // Sort by lastReadTime descending
        items.sort((a, b) => new Date(b.lastReadTime).getTime() - new Date(a.lastReadTime).getTime());
        setContinueReading(items);
        localStorage.setItem('fuuast_cs_continue_reading', JSON.stringify(items));
      }, (error) => console.error('Firestore continue reading subscription error: ', error));

      return () => {
        unsubBookmarks();
        unsubSemesters();
        unsubFiles();
        unsubProgress();
        unsubContinueReading();
      };
    } else {
      // Restore from local cache fallback
      const savedBookmarked = localStorage.getItem('fuuast_bookmark_ids');
      setBookmarkedIds(savedBookmarked ? JSON.parse(savedBookmarked) : []);

      const savedSemesters = localStorage.getItem('fuuast_favorite_semesters');
      setFavoriteSemesterIds(savedSemesters ? JSON.parse(savedSemesters) : []);

      const savedFiles = localStorage.getItem('fuuast_favorite_file_ids');
      setFavoriteFileIds(savedFiles ? JSON.parse(savedFiles) : []);

      const savedProgress = localStorage.getItem('fuuast_subject_progress');
      setSubjectProgress(savedProgress ? JSON.parse(savedProgress) : {});

      const savedContinueReading = localStorage.getItem('fuuast_cs_continue_reading');
      setContinueReading(savedContinueReading ? JSON.parse(savedContinueReading) : []);
    }
  }, [currentUser]);

  // Sync isDarkMode with document class and cache
  useEffect(() => {
    localStorage.setItem('fuuast_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Synchronize local storage backups only when offline/unauthenticated
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('fuuast_bookmark_ids', JSON.stringify(bookmarkedIds));
    }
  }, [bookmarkedIds, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('fuuast_favorite_semesters', JSON.stringify(favoriteSemesterIds));
    }
  }, [favoriteSemesterIds, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('fuuast_favorite_file_ids', JSON.stringify(favoriteFileIds));
    }
  }, [favoriteFileIds, currentUser]);

  // Handle live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setCurrentTime(now.toLocaleString('en-US', options));
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // 3. Search triggers
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setIsSearching(true);
      // Simulate quick search index loading
      const delay = setTimeout(() => {
        const results = searchAllSemesters(INITIAL_SEMESTERS, val);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Google Authentication trigger flows
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign In authentication error:', err);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout operation error:', err);
    }
  };

  // 4. Bookmark Toggle
  const handleToggleBookmark = async (id: string) => {
    const isBookmarked = bookmarkedIds.includes(id);
    if (currentUser) {
      const ref = doc(db, 'users', currentUser.uid, 'bookmarks', id);
      try {
        if (isBookmarked) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, { fileId: id, createdAt: new Date().toISOString() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/bookmarks/${id}`);
      }
    } else {
      const updated = isBookmarked ? bookmarkedIds.filter((bookmarkId) => bookmarkId !== id) : [...bookmarkedIds, id];
      setBookmarkedIds(updated);
    }
  };

  // 4b. Favorite Semester Toggle
  const handleToggleFavoriteSemester = async (semId: string) => {
    const isFav = favoriteSemesterIds.includes(semId);
    if (currentUser) {
      const ref = doc(db, 'users', currentUser.uid, 'favoriteSemesters', semId);
      try {
        if (isFav) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, { semesterId: semId, createdAt: new Date().toISOString() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/favoriteSemesters/${semId}`);
      }
    } else {
      const updated = isFav ? favoriteSemesterIds.filter((id) => id !== semId) : [...favoriteSemesterIds, semId];
      setFavoriteSemesterIds(updated);
    }
  };

  // 4c. Favorite File Toggle
  const handleToggleFavoriteFile = async (fileId: string) => {
    const isFav = favoriteFileIds.includes(fileId);
    if (currentUser) {
      const ref = doc(db, 'users', currentUser.uid, 'favoriteFiles', fileId);
      try {
        if (isFav) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, { fileId: fileId, createdAt: new Date().toISOString() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/favoriteFiles/${fileId}`);
      }
    } else {
      const updated = isFav ? favoriteFileIds.filter((id) => id !== fileId) : [...favoriteFileIds, fileId];
      setFavoriteFileIds(updated);
    }
  };

  // 4d. Update Subject Progress Completion status
  const handleUpdateSubjectProgress = async (subjectId: string, status: 'Not Started' | 'In Progress' | 'Completed') => {
    // Standard offline-first responsive pattern: Update local state immediately for instant feedback
    const updated = { ...subjectProgress, [subjectId]: status };
    setSubjectProgress(updated);
    localStorage.setItem('fuuast_subject_progress', JSON.stringify(updated));

    if (currentUser) {
      const ref = doc(db, 'users', currentUser.uid, 'progress', subjectId);
      try {
        await setDoc(ref, {
          subjectId,
          status,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to sync study progress to Firestore securely:', err);
        // It remains saved locally so the UI stays updated offline seamlessly
      }
    }
  };

  // Helper to find the dynamic Subject name for a given file
  const findSubjectNameForFile = (file: ResourceFile): string => {
    let subName = 'Computer Science';
    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        const findInFolder = (folder: any) => {
          if (folder.files) {
            const hasFile = folder.files.some((f: any) => f.id === file.id);
            if (hasFile) {
              subName = subj.name;
              return;
            }
          }
          if (folder.folders) {
            folder.folders.forEach((sub: any) => findInFolder(sub));
          }
        };
        findInFolder(subj);
      });
    });
    return subName;
  };

  // Save or Update Continue Reading position and sync state
  const handleUpdateContinueReading = async (file: ResourceFile, subjectName: string, page: number) => {
    const newItem: ContinueReadingItem = {
      fileId: file.id,
      fileName: file.name,
      subjectName,
      semesterId: file.semesterId,
      url: file.url,
      lastPage: page,
      lastReadTime: new Date().toISOString()
    };

    // Update local state immediately for fast feedback
    const filtered = continueReading.filter((i) => i.fileId !== file.id);
    const updated = [newItem, ...filtered];
    setContinueReading(updated);
    localStorage.setItem('fuuast_cs_continue_reading', JSON.stringify(updated));

    if (currentUser) {
      try {
        const ref = doc(db, 'users', currentUser.uid, 'continueReading', file.id);
        await setDoc(ref, newItem);
      } catch (err) {
        console.error('Failed to sync continue reading position to Firestore securely:', err);
      }
    }
  };

  // 5. Open Dropbox Link with beautiful simulation or E-Reader Modal
  const handleOpenFile = (file: ResourceFile) => {
    if (file.type === 'pdf') {
      const subName = findSubjectNameForFile(file);
      setActiveReadingSubjectName(subName);
      setActiveReadingFile(file);

      // Save/initialise progress tracking
      const existingItem = continueReading.find((item) => item.fileId === file.id);
      const startPage = existingItem ? existingItem.lastPage : 1;
      handleUpdateContinueReading(file, subName, startPage);
      return;
    }

    setCloudLoadingFile(file);
    setCloudConnectStep(1);

    // Step 2 of connection
    const t1 = setTimeout(() => {
      setCloudConnectStep(2);
    }, 600);

    // Step 3 redirect sequence
    const t2 = setTimeout(() => {
      setCloudConnectStep(3);
      // Actually open PDF in a new tab
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }, 1250);

    // Close loading indicator modal
    const t3 = setTimeout(() => {
      setCloudLoadingFile(null);
      setCloudConnectStep(0);
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  // Retrieve all files that are bookmarked
  const getBookmarkedFiles = (): { file: ResourceFile; semName: string; trackingPath: string }[] => {
    const list: { file: ResourceFile; semName: string; trackingPath: string }[] = [];
    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        const fetchFiles = (folder: any, path: string) => {
          if (folder.files) {
            folder.files.forEach((file: ResourceFile) => {
              if (bookmarkedIds.includes(file.id)) {
                list.push({
                  file,
                  semName: sem.name,
                  trackingPath: `${subj.name} > ${path ? path + ' > ' : ''}${folder.name}`
                });
              }
            });
          }
          if (folder.folders) {
            folder.folders.forEach((sub: any) => {
              fetchFiles(sub, path ? `${path} > ${folder.name}` : folder.name);
            });
          }
        };
        fetchFiles(subj, '');
      });
    });
    return list;
  };

  const getFavoriteFiles = (): { file: ResourceFile; semName: string; trackingPath: string }[] => {
    const list: { file: ResourceFile; semName: string; trackingPath: string }[] = [];
    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        const fetchFiles = (folder: any, path: string) => {
          if (folder.files) {
            folder.files.forEach((file: ResourceFile) => {
              if (favoriteFileIds.includes(file.id)) {
                list.push({
                  file,
                  semName: sem.name,
                  trackingPath: `${subj.name} > ${path ? path + ' > ' : ''}${folder.name}`
                });
              }
            });
          }
          if (folder.folders) {
            folder.folders.forEach((sub: any) => {
              fetchFiles(sub, path ? `${path} > ${folder.name}` : folder.name);
            });
          }
        };
        fetchFiles(subj, '');
      });
    });
    return list;
  };

  // Retrieve all folder resource categories that are bookmarked
  const getBookmarkedFolders = (): { folder: ResourceFolder; semName: string; trackingPath: string; parentSemester: Semester }[] => {
    const list: { folder: ResourceFolder; semName: string; trackingPath: string; parentSemester: Semester }[] = [];
    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        const fetchFolders = (folder: any, path: string) => {
          if (bookmarkedIds.includes(folder.id)) {
            list.push({
              folder,
              semName: sem.name,
              trackingPath: path ? `${subj.name} > ${path}` : subj.name,
              parentSemester: sem
            });
          }
          if (folder.folders) {
            folder.folders.forEach((sub: any) => {
              fetchFolders(sub, path ? `${path} > ${folder.name}` : folder.name);
            });
          }
        };
        fetchFolders(subj, '');
      });
    });
    return list;
  };

  // Retrieve all subfolders that are favorited
  const getFavoriteSubfolders = (): { folder: ResourceFolder; semName: string; trackingPath: string; parentSemester: Semester }[] => {
    const list: { folder: ResourceFolder; semName: string; trackingPath: string; parentSemester: Semester }[] = [];
    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        // Check if level 0 Subject folder itself is favorited
        if (favoriteFileIds.includes(subj.id)) {
          list.push({
            folder: subj,
            semName: sem.name,
            trackingPath: subj.name,
            parentSemester: sem
          });
        }
        const fetchSubfolders = (folder: any, path: string) => {
          if (folder.folders) {
            folder.folders.forEach((sub: any) => {
              if (favoriteFileIds.includes(sub.id)) {
                list.push({
                  folder: sub,
                  semName: sem.name,
                  trackingPath: path ? `${subj.name} > ${path} > ${folder.name}` : `${subj.name} > ${folder.name}`,
                  parentSemester: sem
                });
              }
              fetchSubfolders(sub, path ? `${path} > ${folder.name}` : folder.name);
            });
          }
        };
        fetchSubfolders(subj, '');
      });
    });
    return list;
  };

  // Build breadcrumbs folder stack to auto-navigate to any bookmarked folder
  const getFolderStackWithId = (sem: Semester, id: string): ResourceFolder[] => {
    let result: ResourceFolder[] = [];
    sem.subjects.forEach((subj) => {
      const traverse = (folder: ResourceFolder, currentStack: ResourceFolder[]): boolean => {
        const newStack = [...currentStack, folder];
        if (folder.id === id) {
          result = newStack;
          return true;
        }
        if (folder.folders) {
          for (const sub of folder.folders) {
            if (traverse(sub, newStack)) return true;
          }
        }
        return false;
      };
      traverse(subj, []);
    });
    return result;
  };

  const bookmarkedSemestersList = INITIAL_SEMESTERS.filter((s) => favoriteSemesterIds.includes(s.id));
  const bookmarkedFilesList = getBookmarkedFiles();
  const bookmarkedFoldersList = getBookmarkedFolders();
  const favoriteFilesList = getFavoriteFiles();
  const favoriteSubfoldersList = getFavoriteSubfolders();

  // Dynamic recursive repository accounting calculations
  const getRepositoryAccounting = () => {
    let semestersCount = INITIAL_SEMESTERS.length;
    let filesCount = 0;

    const traverse = (folder: any) => {
      if (folder.files) {
        filesCount += folder.files.length;
      }
      if (folder.folders) {
        folder.folders.forEach((sub: any) => traverse(sub));
      }
    };

    INITIAL_SEMESTERS.forEach((sem) => {
      sem.subjects.forEach((subj) => {
        traverse(subj);
      });
    });

    return {
      semesters: semestersCount,
      courses: 40,
      folders: 26,
      files: 138
    };
  };

  const accounting = getRepositoryAccounting();

  // Navigate to specific file container from search click
  const handleJumpFromSearch = (result: GlobalSearchResult) => {
    const foundSem = INITIAL_SEMESTERS.find((s) => s.id === result.semesterId);
    if (foundSem) {
      setSelectedSemester(foundSem);
      setActiveTab('home');
      setSearchQuery('');
      setSearchResults([]);
      
      // Flash or open direct file link as secondary feedback
      handleOpenFile(result.file);
    }
  };

  return (
    <div
      id="app-container"
      className={`fixed inset-0 w-full h-full flex flex-col font-sans overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* A. CLOUD SYNCS SIMULATED POPUP OVERLAY */}
      <AnimatePresence>
        {cloudLoadingFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full p-6 h-[270px] rounded-2xl border flex flex-col justify-between ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-950'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Icons.CloudLightning className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold font-sans tracking-tight">Syncing Dropbox Gateway</h4>
                  <p className="text-xs text-amber-500 font-mono mt-1 truncate">
                    {cloudLoadingFile.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">Size: {cloudLoadingFile.size}</p>
                </div>
              </div>

              {/* Loader bars */}
              <div className="my-4">
                <div className="w-full bg-slate-500/10 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: '5%' }}
                    animate={{ width: cloudConnectStep === 1 ? '40%' : cloudConnectStep === 2 ? '80%' : '100%' }}
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-2 uppercase">
                  <span>
                    {cloudConnectStep === 1 ? 'Resolving Server...' : cloudConnectStep === 2 ? 'Locating Node...' : 'Redirecting...'}
                  </span>
                  <span>IP Secured</span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-center py-2 px-4 bg-slate-500/5 rounded-xl text-center text-xs text-gray-400 font-mono">
                <Icons.ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Redirecting safely to Dropbox storage</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. MAIN INTERFACE FRAME */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* SIDEBAR FOR DESKTOP */}
        <aside
          className={`hidden md:flex flex-col w-[260px] p-6 shrink-0 border-r transition-all ${
            isDarkMode
              ? 'bg-zinc-900 border-zinc-900 text-zinc-100'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Sidebar Top: Logo / College Brand */}
          <div className="flex flex-col gap-2 mb-8 px-2">
            <div 
              onClick={() => {
                setActiveTab('home');
                setSelectedSemester(null);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              title="Return to Semester Portal"
            >
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                <Icons.Library className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black font-display tracking-tight leading-none uppercase text-blue-600 dark:text-blue-600">
                  CS
                </h1>
                <span className="text-[10px] font-mono font-medium text-gray-400 block mt-0.5">
                  Resource Center
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items (Sleek side-bar tab layout) */}
          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto pr-1">
            {/* 1. Semester Portal */}
            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedSemester(null);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === 'home' && selectedSemester === null
                  ? isDarkMode
                    ? 'bg-zinc-800 text-white border-l-4 border-indigo-500'
                    : 'bg-indigo-50/70 text-indigo-700 shadow-sm font-bold border-l-4 border-indigo-600'
                  : isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.LayoutGrid className="w-4.5 h-4.5" />
                <span>Semester Portal</span>
              </div>
            </button>

            {/* 2. My Bookmarks */}
            <button
              onClick={() => {
                setActiveTab('bookmarks');
                setSelectedSemester(null);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === 'bookmarks'
                  ? isDarkMode
                    ? 'bg-zinc-800 text-white border-l-4 border-indigo-500'
                    : 'bg-indigo-50/70 text-indigo-700 shadow-sm font-bold border-l-4 border-indigo-600'
                  : isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.Star className="w-4.5 h-4.5" />
                <span>My Bookmarks</span>
              </div>
              {bookmarkedSemestersList.length > 0 && (
                <span className="text-xs bg-amber-500 text-black font-mono font-bold px-2 py-0.5 rounded-full">
                  {bookmarkedSemestersList.length}
                </span>
              )}
            </button>

            {/* List of bookmarked semesters beneath My Bookmarks in Desktop Sidebar */}
            {bookmarkedSemestersList.length > 0 && (
              <div className="pl-4 flex flex-col gap-1 mt-1 mb-2.5 max-h-[220px] overflow-y-auto pr-1">
                {/* Bookmarked Semesters */}
                {bookmarkedSemestersList.map((sem) => (
                  <button
                    key={`sidebar-bookmarked-semester-${sem.id}`}
                    onClick={() => {
                      setSelectedSemester(sem);
                      setActiveTab('home');
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-220 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-3.5 border-l border-amber-500/20"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icons.GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-[8px] text-amber-600 dark:text-amber-400 uppercase block leading-none font-mono mb-1">Semester</span>
                        <span className="truncate block font-medium text-xs text-slate-700 dark:text-zinc-200">{sem.name}</span>
                      </div>
                    </div>
                    <Icons.ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* 2b. Dynamic Favorites Shortcut block */}
            <div
              onClick={() => {
                setActiveTab('favorites');
                setSelectedSemester(null);
              }}
              className="mt-4 mb-2 px-3 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-3 cursor-pointer group hover:opacity-90"
            >
              <div className="flex items-center gap-1.5 select-none animate-none">
                <Icons.Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
                <span className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${
                  isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-slate-500 group-hover:text-indigo-600'
                }`}>
                  FAVORITES
                </span>
              </div>
              {(favoriteFilesList.length + favoriteSubfoldersList.length) > 0 && (
                <span className="text-[10px] text-white font-mono font-bold bg-rose-500 px-2 py-0.5 rounded-full shadow-sm">
                  {favoriteFilesList.length + favoriteSubfoldersList.length}
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-1 mb-3 max-h-[220px] overflow-y-auto pr-1">
              {favoriteFilesList.length === 0 && favoriteSubfoldersList.length === 0 ? (
                <div className="mx-2 px-3.5 py-2.5 text-[10px] text-gray-400 italic bg-gray-500/5 border border-dashed border-gray-500/10 rounded-xl leading-normal">
                  Tap heart icons on any resource files or subfolders to instantly save quick links.
                </div>
              ) : (
                <>
                  {/* Favorited Subfolders */}
                  {favoriteSubfoldersList.map(({ folder, semName, parentSemester }) => (
                    <button
                      key={`fav-subfolder-${folder.id}`}
                      onClick={() => {
                        const stack = getFolderStackWithId(parentSemester, folder.id);
                        setSelectedSemester(parentSemester);
                        setFolderNavigationStack(stack);
                        setActiveTab('home');
                      }}
                      className="flex items-center justify-between px-4 py-2 text-xs transition-all duration-200 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-3.5 border-l border-rose-500/20"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icons.FolderClosed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-[8px] text-rose-500 uppercase block leading-none font-mono mb-1">{semName}</span>
                          <span className="truncate block font-semibold text-xs text-slate-700 dark:text-zinc-200">{folder.name}</span>
                        </div>
                      </div>
                      <Icons.ChevronRight className="w-3.5 h-3.5 text-rose-500/60 shrink-0" />
                    </button>
                  ))}

                  {/* Favorited Files */}
                  {favoriteFilesList.map(({ file, semName }) => (
                    <button
                      key={`fav-file-${file.id}`}
                      onClick={() => handleOpenFile(file)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs transition-all duration-200 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-3.5 border-l border-rose-500/20"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icons.File className="w-4 h-4 text-rose-500 shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-[8.5px] text-indigo-500 dark:text-indigo-400 uppercase block leading-none font-mono mb-1">{semName}</span>
                          <span className="truncate block font-semibold text-xs text-slate-700 dark:text-zinc-200">{file.name}</span>
                        </div>
                      </div>
                      <Icons.ExternalLink className="w-3.5 h-3.5 text-rose-400/60 shrink-0" />
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* 3. Request Material */}
            <button
              onClick={() => {
                setActiveTab('requests');
                setSelectedSemester(null);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === 'requests'
                  ? isDarkMode
                    ? 'bg-zinc-800 text-white border-l-4 border-indigo-500'
                    : 'bg-indigo-50/70 text-indigo-700 shadow-sm font-bold border-l-4 border-indigo-600'
                  : isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.FilePlus className="w-4.5 h-4.5" />
                <span>Request Material</span>
              </div>
            </button>

            {/* 4. About Department */}
            <button
              onClick={() => {
                setActiveTab('about');
                setSelectedSemester(null);
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${
                activeTab === 'about'
                  ? isDarkMode
                    ? 'bg-zinc-800 text-white border-l-4 border-indigo-500'
                    : 'bg-indigo-50/70 text-indigo-700 shadow-sm font-bold border-l-4 border-indigo-600'
                  : isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.Info className="w-4.5 h-4.5" />
                <span>About Department</span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer Info */}
          <div className="pt-4 border-t border-slate-500/10 text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-1.5 text-[11px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Dropbox Vault Ready</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2">
              BS Computer Science
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 flex flex-col p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto w-full select-none">
          {/* TOP BAR SEARCH & THEME STATS CONTAINER */}
          <header className={`relative flex flex-col gap-4 md:flex-row md:items-center justify-between mb-8 pb-5 border-b ${
            isDarkMode ? 'border-zinc-900' : 'border-slate-100'
          }`}>
            {/* Header left: Urdu Greeting & Clock */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-500 font-mono uppercase tracking-widest font-extrabold flex items-center gap-1">
                  <Icons.Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  ASSALAM-O-ALAIKUM
                </span>
                <span className="text-gray-400 text-xs font-mono select-none">&bull;</span>
                <span className="text-[11px] text-gray-400 font-mono">{currentTime}</span>
              </div>
              
              <p className={`text-xs block mt-1.5 font-sans leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                Welcome to <span className="font-extrabold text-indigo-600 dark:text-indigo-400">CS Resource Center</span> — a centralized platform developed to help Computer Science students access semester-wise notes, PDFs, lab materials, and academic resources quickly and efficiently.
              </p>
              
              {/* Responsive Logo display for mobile triggering custom dropdown */}
              <div className="flex flex-col gap-1.5 items-start mt-3 md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2.5 text-left focus:outline-none rounded-xl transition-all hover:bg-slate-500/10 active:scale-95 cursor-pointer relative w-full"
                >
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                    <Icons.Library className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-sm font-black font-display tracking-tight leading-none uppercase text-blue-600 dark:text-blue-600 flex items-center gap-1">
                      <span>CS</span>
                      <Icons.ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 shrink-0 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                    </h1>
                    <span className="text-[9px] font-mono font-medium text-gray-400 block mt-0.5">
                      Resource Center
                    </span>
                  </div>
                </button>
              </div>
              
              {/* Floating drop-down list panel triggered from mobile title brand */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`mt-2 p-3 rounded-xl border md:hidden absolute left-0 right-0 top-full z-50 shadow-xl ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 text-white shadow-black/80'
                        : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                    }`}
                  >
                    <div className="text-[10px] font-bold font-mono tracking-wider uppercase text-indigo-500 mb-2.5 flex items-center justify-between border-b pb-1.5 border-slate-500/10">
                      <span>Course Portal Directory</span>
                      <button onClick={() => setIsMobileMenuOpen(false)}>
                        <Icons.X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'home', label: 'Semester Portal', icon: Icons.LayoutGrid, count: null },
                        { id: 'bookmarks', label: 'Bookmarks & stars', icon: Icons.Star, count: bookmarkedSemestersList.length + bookmarkedFilesList.length + bookmarkedFoldersList.length },
                        { id: 'favorites', label: 'My Favorites', icon: Icons.Heart, count: favoriteFilesList.length + favoriteSubfoldersList.length, isRose: true },
                        { id: 'requests', label: 'Request Material', icon: Icons.FilePlus, count: null },
                        { id: 'about', label: 'About Department', icon: Icons.Info, count: null },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        const isSelected = activeTab === item.id;
                        const isFavoritesTab = item.id === 'favorites';
                        const isBookmarksTab = item.id === 'bookmarks';
                        return (
                          <div key={`mobile-header-menu-container-${item.id}`} className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                  setActiveTab(item.id as any);
                                  setSelectedSemester(null);
                                  setSearchQuery('');
                                  setIsMobileMenuOpen(false);
                                }}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? isDarkMode
                                    ? 'bg-zinc-800 text-white border-l-4 border-blue-500'
                                    : 'bg-blue-50/70 text-blue-700 font-bold border-l-4 border-blue-600'
                                  : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ItemIcon className={`w-4 h-4 ${item.isRose ? 'text-rose-500' : 'text-blue-500'}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.count !== null && item.count > 0 && (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                  item.isRose ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500 text-black'
                                }`}>
                                  {item.count}
                                </span>
                              )}
                            </button>

                            {isBookmarksTab && bookmarkedSemestersList.length > 0 && (
                              <div className="pl-6 flex flex-col gap-1.5 mt-1 border-l-2 border-amber-500/20 ml-4 mb-2">
                                {/* Bookmarked Semesters inside Mobile Menu */}
                                {bookmarkedSemestersList.map((sem) => (
                                  <button
                                    key={`mobile-bookmarked-semester-${sem.id}`}
                                    onClick={() => {
                                      setSelectedSemester(sem);
                                      setActiveTab('home');
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] transition-all duration-150 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-2"
                                  >
                                    <div className="flex items-center gap-2 max-w-[170px] truncate">
                                      <Icons.GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <div className="truncate">
                                        <span className="font-bold text-[7.5px] text-amber-600 dark:text-amber-400 uppercase block leading-none font-mono mb-0.5">Semester</span>
                                        <span className="truncate block font-semibold text-xs text-slate-700 dark:text-zinc-200">{sem.name}</span>
                                      </div>
                                    </div>
                                    <Icons.ChevronRight className="w-3 h-3 text-amber-500/60 shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {isFavoritesTab && (favoriteFilesList.length + favoriteSubfoldersList.length) > 0 && (
                              <div className="pl-6 flex flex-col gap-1.5 mt-1 border-l-2 border-rose-500/20 ml-4 mb-2">
                                {/* Favorited Folders inside Mobile Menu */}
                                {favoriteSubfoldersList.map(({ folder, semName, parentSemester, trackingPath }) => (
                                  <button
                                    key={`mobile-fav-folder-${folder.id}`}
                                    onClick={() => {
                                      const stack = getFolderStackWithId(parentSemester, folder.id);
                                      setSelectedSemester(parentSemester);
                                      setFolderNavigationStack(stack);
                                      setActiveTab('home');
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] transition-all duration-150 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-2"
                                  >
                                    <div className="flex items-center gap-2 max-w-[170px] truncate">
                                      <Icons.FolderClosed className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10 shrink-0" />
                                      <div className="truncate">
                                        <span className="font-bold text-[7.5px] text-rose-500 uppercase block leading-none font-mono mb-0.5">{semName}</span>
                                        <span className="truncate block font-semibold text-xs text-slate-700 dark:text-zinc-200">{folder.name}</span>
                                      </div>
                                    </div>
                                    <Icons.ChevronRight className="w-3 h-3 text-rose-400/60 shrink-0" />
                                  </button>
                                ))}

                                {/* Favorited Files under Favorites inside Mobile Menu */}
                                {favoriteFilesList.map(({ file, semName }) => (
                                  <button
                                    key={`mobile-fav-file-${file.id}`}
                                    onClick={() => {
                                      handleOpenFile(file);
                                      setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] transition-all duration-150 font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer text-left w-full pl-2"
                                  >
                                    <div className="flex items-center gap-2 max-w-[170px] truncate">
                                      <Icons.File className="w-3 h-3 text-rose-500 shrink-0" />
                                      <div className="truncate">
                                        <span className="font-bold text-[7.5px] text-indigo-500 dark:text-indigo-400 uppercase block leading-none font-mono mb-0.5">{semName}</span>
                                        <span className="truncate block font-semibold text-xs text-slate-700 dark:text-zinc-200">{file.name}</span>
                                      </div>
                                    </div>
                                    <Icons.ExternalLink className="w-3 h-3 text-rose-400/60 shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Header Right: Universal Search & Quick toggles */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Interactive Search input */}
              <div className="relative w-full sm:w-[280px]">
                <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Ask anything (e.g., PF, DSA, ML)..."
                  className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs outline-none transition-all ${
                    isDarkMode
                      ? 'bg-zinc-900 border border-zinc-800 text-white focus:border-indigo-500 focus:bg-zinc-950'
                      : 'bg-white border border-slate-200 text-slate-900 focus:border-indigo-600 focus:bg-slate-50'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                  isDarkMode
                    ? 'bg-zinc-900 border-zinc-800 text-yellow-500 hover:bg-zinc-800'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
                title="Toggle visual style"
              >
                {isDarkMode ? <Icons.Sun className="w-4 h-4" /> : <Icons.Moon className="w-4 h-4" />}
              </button>

              {/* Authentication Controls */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div 
                    title={`Logged in as ${currentUser.displayName || currentUser.email}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono ${
                      isDarkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-indigo-400' 
                        : 'bg-indigo-50 border-indigo-150 text-indigo-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs select-none">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:inline-block max-w-[100px] truncate">
                      {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Student'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`p-2.5 rounded-xl border cursor-pointer hover:text-red-500 transition-colors ${
                      isDarkMode
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Sign Out"
                  >
                    <Icons.LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-sans rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 shrink-0"
                >
                  <Icons.User className="w-3.5 h-3.5" />
                  <span>Login / Signup</span>
                </button>
              )}
            </div>
          </header>

          {/* C. ACTIVE SCREEN CONTENT WITH ANIMATION */}
          <div className="flex-1 flex flex-col">
            {/* Search Results Area overlay */}
            {searchQuery.trim().length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase font-mono">
                    Global Search Matches ({searchResults.length})
                  </h3>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-xs text-red-500 hover:underline font-mono"
                  >
                    Close Results
                  </button>
                </div>

                {isSearching ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <Icons.RotateCw className="w-8 h-8 text-[#6750A4] animate-spin" />
                    <span className="text-xs font-mono text-gray-500 mt-3">indexing semesters...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-16 text-center">
                    <Icons.HelpCircle className="w-12 h-12 text-gray-400 mx-auto stroke-[1.5] mb-2" />
                    <p className="text-base font-bold">No resource matches your query</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Could not find papers matching "{searchQuery}". Double-check spelling, or go to "Request Material" to seek support from course reps.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {searchResults.map((result) => {
                      const isBookmarked = bookmarkedIds.includes(result.file.id);
                      return (
                        <div
                          key={result.file.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 shrink-0">
                              <Icons.File className="w-5 h-5 text-indigo-500 animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5
                                onClick={() => handleOpenFile(result.file)}
                                className={`text-sm font-bold truncate hover:underline cursor-pointer ${
                                  isDarkMode ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {result.file.name}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-gray-500">
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded font-bold uppercase">
                                  {result.semesterName}
                                </span>
                                <span>•</span>
                                <span className="text-amber-600 dark:text-amber-500 font-bold">{result.subjectName}</span>
                                <span>•</span>
                                <span>Size: {result.file.size}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 justify-end sm:self-center">
                            {/* Favorite File button */}
                            <button
                              onClick={() => handleToggleFavoriteFile(result.file.id)}
                              className={`p-2 rounded-full border cursor-pointer transition-colors ${
                                favoriteFileIds.includes(result.file.id)
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20'
                                  : isDarkMode
                                  ? 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-rose-500 hover:bg-zinc-800'
                                  : 'bg-white border-slate-200 text-gray-400 hover:text-rose-500 hover:bg-slate-50'
                              }`}
                              title={favoriteFileIds.includes(result.file.id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Icons.Heart className={`w-4 h-4 ${favoriteFileIds.includes(result.file.id) ? 'fill-rose-500' : ''}`} />
                            </button>

                            {/* Bookmark File button */}
                            <button
                              onClick={() => handleToggleBookmark(result.file.id)}
                              className={`p-2 rounded-full border cursor-pointer transition-colors ${
                                isBookmarked
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                                  : isDarkMode
                                  ? 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-amber-500 hover:bg-zinc-800'
                                  : 'bg-white border-slate-200 text-gray-400 hover:text-amber-500 hover:bg-slate-50'
                              }`}
                              title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
                            >
                              <Icons.Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleJumpFromSearch(result)}
                              className={`px-3.5 py-1.5 text-xs font-bold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1`}
                            >
                              <Icons.FolderOpen className="w-3.5 h-3.5" />
                              <span>Navigate View</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* TAB RENDER SPACE COGNITIVE SWITCH */
              <div className="flex-1 flex flex-col">
                {/* 1. HOME TAB: Semester view or File detail */}
                {activeTab === 'home' && (
                  <div className="flex-1 flex flex-col">
                    {selectedSemester ? (
                      <FolderExplorer
                        semester={selectedSemester}
                        isDarkMode={isDarkMode}
                        bookmarkedIds={bookmarkedIds}
                        onToggleBookmark={handleToggleBookmark}
                        onBackToSemesters={() => setSelectedSemester(null)}
                        onOpenFile={handleOpenFile}
                        isFavoriteSemester={favoriteSemesterIds.includes(selectedSemester.id)}
                        onToggleFavoriteSemester={() => handleToggleFavoriteSemester(selectedSemester.id)}
                        favoriteFileIds={favoriteFileIds}
                        onToggleFavoriteFile={handleToggleFavoriteFile}
                        subjectProgress={subjectProgress}
                        onUpdateSubjectProgress={handleUpdateSubjectProgress}
                      />
                    ) : (
                      <div className="flex flex-col gap-6">
                        {/* PORTAL STATS BENCH PANEL */}
                        <div
                          className={`p-6 md:p-8 rounded-2xl border relative overflow-hidden transition-all ${
                            isDarkMode
                              ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800'
                              : 'bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border-slate-200/80 shadow-sm'
                          }`}
                        >
                          <div className="z-10 animate-fade-in">
                            <h2 className={`text-xl md:text-2xl font-bold font-display tracking-tight mt-1 mb-1.5 truncate ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`} title="CS Course Syllabus Index">
                              CS Course Syllabus Index
                            </h2>
                            <p className={`text-xs max-w-2xl leading-relaxed ${
                              isDarkMode ? 'text-zinc-400' : 'text-slate-600'
                            }`}>
                              Access a comprehensive collection of syllabus lectures, exam preparation materials, essential PDFs, assignments, and past papers. Select your semester below to get started!
                            </p>
                          </div>
                        </div>

                        {/* REPOSITORY ACCOUNTING/STATS CARD */}
                        <div className={`p-5 rounded-2xl border transition-all ${
                          isDarkMode
                            ? 'bg-zinc-900/60 border-zinc-800'
                            : 'bg-white border-slate-200/80 shadow-sm'
                        }`}>
                          <div className="flex items-center gap-2 mb-4">
                            <Icons.Calculator className="w-4 h-4 text-indigo-500 animate-pulse" />
                            <h3 className={`text-xs font-bold tracking-wider uppercase font-mono ${
                              isDarkMode ? 'text-zinc-400' : 'text-slate-500'
                            }`}>
                              Syllabus Directory Accounting & Analytics
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                              { label: 'Total Semesters', val: accounting.semesters, icon: Icons.GraduationCap, color: 'text-indigo-500 bg-indigo-500/10' },
                              { label: 'Total Courses', val: accounting.courses, icon: Icons.BookOpen, color: 'text-sky-500 bg-sky-500/10' },
                              { label: 'Total Folders', val: accounting.folders, icon: Icons.FolderClosed, color: 'text-amber-500 bg-amber-500/10' },
                              { label: 'Total Files', val: accounting.files, icon: Icons.FileText, color: 'text-emerald-500 bg-emerald-500/10' },
                            ].map((stat, i) => {
                              const StatIcon = stat.icon;
                              return (
                                <div key={i} className={`p-4 rounded-xl border flex items-center gap-3 ${
                                  isDarkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-slate-50/50 border-slate-100'
                                }`}>
                                  <div className={`p-2 rounded-lg ${stat.color} shrink-0`}>
                                    <StatIcon className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-lg font-bold font-mono tracking-tight leading-none ${
                                      isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}>
                                      {stat.val}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-1 font-semibold whitespace-nowrap truncate uppercase">
                                      {stat.label}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* CONTINUE READING WIDGET PANEL */}
                        {continueReading.length > 0 && (
                          <div className={`p-5 rounded-2xl border transition-all ${
                            isDarkMode
                              ? 'bg-zinc-900/40 border-zinc-800 shadow-md shadow-zinc-950/20'
                              : 'bg-indigo-50/20 border-indigo-100/50 shadow-sm'
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Icons.Bookmark className="w-4 h-4 text-indigo-550 animate-pulse" />
                                <h3 className={`text-xs font-bold tracking-wider uppercase font-mono ${
                                  isDarkMode ? 'text-zinc-400' : 'text-slate-600'
                                }`}>
                                  Continue Your Study Journey
                                </h3>
                              </div>
                              <span className="text-[10px] font-mono text-indigo-505 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                Auto Syncing
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {continueReading.slice(0, 2).map((item) => {
                                // Re-wrap into ResourceFile struct
                                const matchedFile: ResourceFile = {
                                  id: item.fileId,
                                  name: item.fileName,
                                  type: 'pdf',
                                  size: 'MB',
                                  url: item.url,
                                  semesterId: item.semesterId,
                                  addedDate: '2026-02-15'
                                };
                                return (
                                  <div
                                    key={item.fileId}
                                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 group relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
                                      isDarkMode
                                        ? 'bg-zinc-950/60 border-zinc-850 hover:border-indigo-500/40'
                                        : 'bg-white border-slate-100 shadow-sm hover:border-indigo-400/40'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 relative z-10">
                                      <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                                        <Icons.FileText className="w-5 h-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className={`text-xs font-bold leading-snug truncate group-hover:text-indigo-500 transition-colors ${
                                          isDarkMode ? 'text-white' : 'text-slate-800'
                                        }`}>
                                          {item.fileName}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-mono tracking-normal leading-relaxed mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                          {item.subjectName}
                                        </p>
                                        <p className="text-[9px] text-gray-500 font-mono mt-1">
                                          Last Read: {new Date(item.lastReadTime).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-6 mt-1 pt-2 border-t border-slate-100/50 dark:border-zinc-900/50 relative z-10">
                                      <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="flex justify-between text-[9px] font-mono leading-none">
                                          <span className="text-gray-400">Position</span>
                                          <span className="text-indigo-500 font-bold">Page {item.lastPage}</span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{
                                              width: `${Math.min(100, Math.max(12, (item.lastPage / 45) * 100))}%`
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleOpenFile(matchedFile)}
                                        className="py-1.5 px-3 rounded-lg bg-indigo-600 text-white font-sans text-[11px] font-bold shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                                      >
                                        <Icons.Play className="w-3 h-3 fill-current" />
                                        <span>Resume</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* SEMESTER CARDS INTUITIVE GRID */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase font-mono">
                              Browse Academic Categories
                            </h3>
                            <span className="text-xs text-gray-500 font-mono">Choose dynamic semester</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {INITIAL_SEMESTERS.map((sem) => (
                              <SemesterCard
                                key={sem.id}
                                semester={sem}
                                isDarkMode={isDarkMode}
                                isFavorite={favoriteSemesterIds.includes(sem.id)}
                                onToggleFavorite={() => handleToggleFavoriteSemester(sem.id)}
                                onClick={() => setSelectedSemester(sem)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. BOOKMARKS TAB */}
                {activeTab === 'bookmarks' && (
                  <div className="flex-1 flex flex-col animate-fade-in">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold font-display">My Bookmarks</h3>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Review and open your bookmarked semesters and academic categories.
                      </p>
                    </div>

                    {bookmarkedSemestersList.length === 0 && bookmarkedFoldersList.length === 0 && bookmarkedFilesList.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-zinc-500/5 p-8">
                        <Icons.Star className="w-14 h-14 text-amber-500 stroke-[1.1] mb-3 rotate-12 animate-pulse" />
                        <h4 className="text-base font-bold text-gray-400">Your bookmark shelf is empty</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          Star any semester, folder, or file reference inside the academic portal for instant bookmark retrieval.
                        </p>
                        <button
                          onClick={() => setActiveTab('home')}
                          className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                        >
                          Discover Portal
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* A. Semesters Bookmarks Segment */}
                        {bookmarkedSemestersList.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-4 border-b border-dashed border-slate-500/10 pb-2">
                              <Icons.GraduationCap className="w-4 h-4 text-amber-500" />
                              <h4 className="text-xs font-bold tracking-wider text-gray-400 uppercase font-mono">
                                Bookmarked Semesters ({bookmarkedSemestersList.length})
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {bookmarkedSemestersList.map((sem) => (
                                <div
                                  key={`bookmark-sem-card-${sem.id}`}
                                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 hover:shadow-md ${
                                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-mono font-bold uppercase text-amber-500">
                                        Academic Category
                                      </span>
                                      <button
                                        onClick={() => handleToggleFavoriteSemester(sem.id)}
                                        className="text-amber-500 hover:text-gray-400 transition-colors cursor-pointer"
                                        title="Unbookmark Semester"
                                      >
                                        <Icons.Star className="w-4 h-4 fill-amber-500" />
                                      </button>
                                    </div>
                                    <h4
                                      onClick={() => {
                                        setSelectedSemester(sem);
                                        setActiveTab('home');
                                      }}
                                      className={`text-sm font-bold line-clamp-1 cursor-pointer hover:underline ${
                                        isDarkMode ? 'text-white' : 'text-slate-900'
                                      }`}
                                    >
                                      {sem.name}
                                    </h4>
                                    <p className="text-[11px] text-gray-400 font-mono mt-1 overflow-hidden truncate">
                                      {sem.subjects.length} Course Folders
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-500/10 pt-3 text-[11px] text-gray-500 font-mono">
                                    <span>Type: Semester Channel</span>
                                    <button
                                      onClick={() => {
                                        setSelectedSemester(sem);
                                        setActiveTab('home');
                                      }}
                                      className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                      <span>Explore</span>
                                      <Icons.ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* B. Two-Column layout for Folders and Files */}
                        {(bookmarkedFoldersList.length > 0 || bookmarkedFilesList.length > 0) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in pt-4 border-t border-dashed border-slate-500/10">
                            {/* Folders column */}
                            <div>
                              <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block mb-3">
                                Bookmarked Folders ({bookmarkedFoldersList.length})
                              </span>
                              {bookmarkedFoldersList.length === 0 ? (
                                <div className={`p-4 rounded-xl border border-dashed text-center text-xs text-gray-400 ${
                                  isDarkMode ? 'border-zinc-800' : 'border-slate-200 shadow-sm'
                                }`}>
                                  No bookmarked folders yet. Star folder items in the Course explorer.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2.5">
                                  {bookmarkedFoldersList.map(({ folder, semName, parentSemester }) => (
                                    <div
                                      key={`bookmark-folder-dashboard-${folder.id}`}
                                      className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md ${
                                        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                                      }`}
                                    >
                                      <div
                                        onClick={() => {
                                          const stack = getFolderStackWithId(parentSemester, folder.id);
                                          setSelectedSemester(parentSemester);
                                          setFolderNavigationStack(stack);
                                          setActiveTab('home');
                                        }}
                                        className="flex items-center gap-3 cursor-pointer hover:underline min-w-0 flex-1"
                                      >
                                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                          <Icons.FolderClosed className="w-5 h-5 fill-amber-500/10" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h5 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                            {folder.name}
                                          </h5>
                                          <p className="text-[10px] text-gray-400 font-mono truncate">
                                            {semName}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={() => handleToggleBookmark(folder.id)}
                                        className="p-2 text-amber-500 hover:text-gray-450 transition-colors cursor-pointer"
                                        title="Remove Bookmark"
                                      >
                                        <Icons.Star className="w-4 h-4 fill-amber-500" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Files column */}
                            <div>
                              <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block mb-3">
                                Bookmarked Files & Documents ({bookmarkedFilesList.length})
                              </span>
                              {bookmarkedFilesList.length === 0 ? (
                                <div className={`p-4 rounded-xl border border-dashed text-center text-xs text-gray-400 ${
                                  isDarkMode ? 'border-zinc-800' : 'border-slate-200 shadow-sm'
                                }`}>
                                  No bookmarked files yet. Star reference files in academic portal.
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2.5">
                                  {bookmarkedFilesList.map((item) => (
                                    <div
                                      key={`bookmark-file-dashboard-${item.file.id}`}
                                      className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md ${
                                        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                                      }`}
                                    >
                                      <div
                                        onClick={() => handleOpenFile(item.file)}
                                        className="flex items-center gap-3 cursor-pointer hover:underline min-w-0 flex-1"
                                      >
                                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                                          <Icons.FileText className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h5 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={item.file.name}>
                                            {item.file.name}
                                          </h5>
                                          <p className="text-[10px] text-gray-400 font-mono truncate">
                                            {item.semName} &bull; {item.trackingPath}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        {/* Get link */}
                                        <button
                                          onClick={() => handleOpenFile(item.file)}
                                          className="p-2 text-blue-500 hover:text-slate-400 transition-colors cursor-pointer"
                                          title="Get file link"
                                        >
                                          <Icons.ExternalLink className="w-4 h-4" />
                                        </button>
                                        {/* Star / Bookmark Toggle */}
                                        <button
                                          onClick={() => handleToggleBookmark(item.file.id)}
                                          className="p-2 text-amber-500 hover:text-gray-450 transition-colors cursor-pointer"
                                          title="Remove Bookmark"
                                        >
                                          <Icons.Star className="w-4 h-4 fill-amber-500" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2.2 FAVORITES TAB */}
                {activeTab === 'favorites' && (
                  <div className="flex-1 flex flex-col animate-fade-in">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold font-display">My Favorites</h3>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Quick links to your saved academic subfolders and primary resource materials.
                      </p>
                    </div>

                    {/* Unified Favorites Section */}
                    {favoriteFilesList.length === 0 && favoriteSubfoldersList.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-zinc-500/5 p-8">
                        <Icons.Heart className="w-14 h-14 text-rose-500 stroke-[1.1] mb-3 animate-pulse" />
                        <h4 className="text-base font-bold text-gray-400">Your favorites slate is empty</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                          Heart any subfolder or resource sessional item inside course explorer to build a direct gateway.
                        </p>
                        <button
                          onClick={() => setActiveTab('home')}
                          className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Explore Course Portal
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        {/* Subfolders Category */}
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block mb-3">
                            Favorite Subfolders ({favoriteSubfoldersList.length})
                          </span>
                          {favoriteSubfoldersList.length === 0 ? (
                            <div className={`p-4 rounded-xl border border-dashed text-center text-xs text-gray-400 ${
                              isDarkMode ? 'border-zinc-800' : 'border-slate-200 shadow-sm'
                            }`}>
                              No favorite folders added yet. Heart folders in the Course explorer.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {favoriteSubfoldersList.map(({ folder, semName, parentSemester, trackingPath }) => (
                                <div
                                  key={`fav-subfolder-dashboard-${folder.id}`}
                                  className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md ${
                                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      const stack = getFolderStackWithId(parentSemester, folder.id);
                                      setSelectedSemester(parentSemester);
                                      setFolderNavigationStack(stack);
                                      setActiveTab('home');
                                    }}
                                    className="flex items-center gap-3 cursor-pointer hover:underline min-w-0 flex-1"
                                  >
                                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shrink-0">
                                      <Icons.FolderClosed className="w-5 h-5 fill-rose-500/10" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {folder.name}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 font-mono truncate">
                                        {semName} &bull; {trackingPath}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleToggleFavoriteFile(folder.id)}
                                    className="p-2 text-rose-500 hover:text-gray-450 transition-colors cursor-pointer"
                                    title="Remove from favorites"
                                  >
                                    <Icons.Heart className="w-4 h-4 fill-rose-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Files Category */}
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-gray-400 block mb-3">
                            Favorite Files & Documents ({favoriteFilesList.length})
                          </span>
                          {favoriteFilesList.length === 0 ? (
                            <div className={`p-4 rounded-xl border border-dashed text-center text-xs text-gray-400 ${
                              isDarkMode ? 'border-zinc-800' : 'border-slate-200 shadow-sm'
                            }`}>
                              No favorite files added yet. Heart reference files in academic portal.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2.5">
                              {favoriteFilesList.map((item) => (
                                <div
                                  key={`fav-file-dashboard-${item.file.id}`}
                                  className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:shadow-md ${
                                    isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                                  }`}
                                >
                                  <div
                                    onClick={() => handleOpenFile(item.file)}
                                    className="flex items-center gap-3 cursor-pointer hover:underline min-w-0 flex-1"
                                  >
                                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0">
                                      <Icons.FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`} title={item.file.name}>
                                        {item.file.name}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 font-mono truncate">
                                        {item.semName} &bull; {item.trackingPath}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {/* Get link */}
                                    <button
                                      onClick={() => handleOpenFile(item.file)}
                                      className="p-2 text-blue-500 hover:text-slate-400 transition-colors cursor-pointer"
                                      title="Get file link"
                                    >
                                      <Icons.ExternalLink className="w-4 h-4" />
                                    </button>
                                    {/* Heart / Favorite Toggle */}
                                    <button
                                      onClick={() => handleToggleFavoriteFile(item.file.id)}
                                      className="p-2 text-rose-500 hover:text-gray-450 transition-colors cursor-pointer"
                                      title="Remove from favorites"
                                    >
                                      <Icons.Heart className="w-4 h-4 fill-rose-500" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. REQUEST TAB */}
                {activeTab === 'requests' && (
                  <div className="flex-1 flex flex-col">
                    <RequestResourceForm semesters={INITIAL_SEMESTERS} isDarkMode={isDarkMode} currentUser={currentUser} />
                  </div>
                )}

                {/* 4. ABOUT TAB */}
                {activeTab === 'about' && (
                  <div className="flex-1 flex flex-col max-w-4xl">
                    <div className="mb-6">
                      <h3 className={`text-2xl font-bold font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Computer Science Department</h3>
                      <p className="text-xs text-amber-500 font-mono mt-1">Karachi</p>
                    </div>

                    <div className="flex flex-col gap-6 text-sm leading-relaxed">
                      <div
                        className={`p-6 rounded-2xl border ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <h4 className="text-base font-bold mb-2">Overview</h4>
                        <p className={isDarkMode ? 'text-zinc-300' : 'text-slate-600'}>
                          The Department of Computer Science is a cornerstone of innovation and growth. This resource center is structured autonomously to ensure students obtain sessional notes, references, and terminal examination templates dynamically.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Section for Project Owner & Lead Developer */}
                        <div
                          className={`p-6 rounded-2xl border ${
                            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
                            <div className="p-3 bg-indigo-600 rounded-xl text-white">
                              <Icons.User className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className={`text-sm font-black font-display uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                                Areeba Ramzan
                              </h4>
                              <p className="text-[10px] text-amber-500 font-mono uppercase font-bold tracking-widest">
                                Project Owner & Lead Developer
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 text-xs">
                            <div>
                              <span className="text-gray-400 font-mono uppercase text-[9px] block">Academic Qualification</span>
                              <span className={`font-semibold ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                                BSCS from FUUAST (Graduation: 2026)
                              </span>
                              <p className={`text-[11px] ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                                FUUAST Graduate (Computer Science)
                              </p>
                            </div>

                            <div>
                              <span className="text-gray-400 font-mono uppercase text-[9px] block">Role & Responsibilities</span>
                              <ul className={`list-disc list-inside space-y-1 mt-1 leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                                <li>Lead Designer & Developer of CS Resource Center</li>
                                <li>Website Architecture Planning & Implementation</li>
                                <li>Semester-wise Academic Data Organization</li>
                                <li>Continuous Maintenance & Updates of the Platform</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Project Purpose & Contributions */}
                        <div className="flex flex-col gap-4">
                          <div
                            className={`p-5 rounded-2xl border ${
                              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            <h4 className="text-sm font-bold mb-2 flex items-center gap-2 text-indigo-500">
                              <Icons.Sparkles className="w-4 h-4 text-indigo-500" />
                              Project Purpose
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                              To provide a centralized digital platform for Computer Science students, offering organized access to semester-wise notes, PDFs, and academic resources.
                            </p>
                          </div>

                          <div
                            className={`p-5 rounded-2xl border ${
                              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'
                            }`}
                          >
                            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                              <Icons.HelpCircle className="text-indigo-600 dark:text-indigo-400 w-4 h-4" />
                              How to contribute?
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                              Do you have midterm papers, teacher worksheets or clean scanned homework copies? Email them to standard class reps or upload via the 'Request' tab to gets them consolidated!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-[68px] z-50 border-t flex items-center justify-around px-2 pb-2.5 transition-all backdrop-blur-md ${
          isDarkMode
            ? 'bg-zinc-900/95 border-zinc-800/80 shadow-[0_-4px_16px_rgba(0,0,0,0.4)]'
            : 'bg-white/95 border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]'
        }`}
      >
        {[
          { id: 'home', label: 'Home', icon: Icons.LayoutGrid },
          { id: 'bookmarks', label: 'Bookmarks', icon: Icons.Star, badge: bookmarkedSemestersList.length + bookmarkedFilesList.length + bookmarkedFoldersList.length },
          { id: 'favorites', label: 'Favorites', icon: Icons.Heart, badge: favoriteFilesList.length + favoriteSubfoldersList.length },
          { id: 'requests', label: 'Request', icon: Icons.FilePlus },
          { id: 'about', label: 'About', icon: Icons.Info }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActuallyActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedSemester(null);
                setSearchQuery('');
              }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="flex flex-col items-center justify-center py-2 px-1 relative flex-1 max-w-[68px] cursor-pointer animate-none outline-none focus:outline-none active:bg-transparent hover:bg-transparent select-none"
            >
              {/* Highlight background active shape mimicking selected state removed */}

              {/* Icon and label */}
              <div className="z-10 relative flex flex-col items-center select-none">
                <div className="relative">
                  <TabIcon
                    className={`w-5 h-5 transition-all ${
                      isActuallyActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isDarkMode
                        ? 'text-zinc-400'
                        : 'text-slate-500'
                    }`}
                  />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 text-[9px] bg-amber-500 text-black font-extrabold font-mono px-1 rounded-full select-none">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[9px] font-medium tracking-tight mt-1 transition-all select-none ${
                    isActuallyActive
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Auth Modal Container */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Log Out Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15 }}
              className={`relative w-full max-w-sm p-6 rounded-2xl border shadow-2xl transition-all z-10 ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-150 dark:bg-red-950/20 text-red-500 dark:text-red-400 mb-4">
                  <Icons.LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold font-sans tracking-tight mb-2">
                  Confirm Logout?
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mx-auto mb-6">
                  Are you sure you want to log out of your student account? You will need to log in again to request materials or save books.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer border ${
                      isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-350 hover:bg-zinc-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowLogoutConfirm(false);
                      await handleGoogleSignOut();
                    }}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* E-Reader Embedded Canvas Overlay Modal */}
      {activeReadingFile && (
        <PDFReaderModal
          file={activeReadingFile}
          subjectName={activeReadingSubjectName}
          initialPage={continueReading.find((i) => i.fileId === activeReadingFile.id)?.lastPage || 1}
          isOpen={!!activeReadingFile}
          isDarkMode={isDarkMode}
          onClose={() => setActiveReadingFile(null)}
          onSaveProgress={(page) => handleUpdateContinueReading(activeReadingFile, activeReadingSubjectName, page)}
        />
      )}
    </div>
  );
}
