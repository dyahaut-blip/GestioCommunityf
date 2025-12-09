

export type UserRole = 'Administrateur' | 'Responsable de zone' | 'Responsable' | 'Pasteur' | 'Leader' | 'Membre';
export type ManagedGender = 'Tous' | 'Homme' | 'Femme';

export interface Permissions {
  manageMembers: boolean;
  attendance: boolean;
  followups: boolean;
  events: boolean;
  exportData: boolean;
}

export interface UserFormData {
  email: string;
  password: string;
  role: UserRole;
  managedZone: string;
  managedGender: ManagedGender;
  permissions: Permissions;
}

export interface User extends UserFormData {
  id: string;
  status: 'Actif' | 'Inactif';
  createdAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  location: string; // Used for Quartier
  zone?: string;
  address?: string;
  maritalStatus?: string;
  birthDate?: string;
  role: string;
  status: 'Actif' | 'Inactif' | 'Suspendu';
  joinDate: string;
  gender: 'Homme' | 'Femme';
  avatarColor: string;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  type: 'event' | 'birthday' | 'meeting';
  category?: string;
  time: string;
  location: string;
  description?: string;
  image?: string; // Added image field
}

export interface FollowUpTask {
  id: string;
  memberId: string;
  memberName: string;
  reason: string; // "Absent", "Malade", "Nouveau"
  date?: string; // Date of the followup creation/target
  daysAbsent?: number;
  assignedTo?: string; // Name of the leader assigned
  assignedBy?: string; // Admin who assigned it
  status: 'À faire' | 'En cours' | 'Terminé';
  type: 'Appel' | 'Visite' | 'Indéfini';
  lastUpdate?: string;
  notes?: string;
}

export type Page = 'dashboard' | 'members' | 'attendance' | 'events' | 'recycle' | 'settings';

export interface PageProps {
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentUser?: User | null; // Added currentUser to prop drilling
}