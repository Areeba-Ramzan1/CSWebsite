/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileType = 'pdf' | 'word' | 'slides' | 'zip' | 'link';

export interface ResourceFile {
  id: string;
  name: string;
  type: FileType;
  size: string;
  url: string; // Dropbox placeholder link
  downloadCount?: number;
  addedDate: string;
  semesterId: string;
}

export interface ResourceFolder {
  id: string;
  name: string;
  folders?: ResourceFolder[];
  files?: ResourceFile[];
  description?: string;
  directUrl?: string; // Point directly to Dropbox
  externalType?: 'file' | 'folder'; // To distinguish files vs folders
}

export interface Semester {
  id: string;
  name: string;
  fullName: string;
  description: string;
  subjects: ResourceFolder[]; // Subfolders representing courses
  color: string; // Tailwind color class for card
  icon: string; // Lucide icon identifier
}

export interface UserRequest {
  id: string;
  studentName: string;
  email: string;
  semesterId: string;
  courseName: string;
  resourceType: 'notes' | 'pdf' | 'past_paper' | 'assignment';
  description: string;
  status: 'pending' | 'approved' | 'unavailable';
  date: string;
}
