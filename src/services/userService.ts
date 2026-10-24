/**
 * InterviewIQ User Service
 *
 * Manages user profile and settings persistence with strict UID data isolation.
 * Connects with server REST API, Firebase Auth profile updates, and local caches.
 */

import { UserProfile, UserSettings } from '../types';
import { auth } from './firebase';
import { updateProfile, deleteUser } from 'firebase/auth';

function getProfileStorageKey(uid: string): string {
  return `interviewiq_profile_${uid}`;
}

function getSettingsStorageKey(uid: string): string {
  return `interviewiq_settings_${uid}`;
}

export function createDefaultProfile(uid: string, email: string, displayName?: string): UserProfile {
  const name = displayName && displayName.trim() ? displayName.trim() : email.split('@')[0] || 'Candidate';
  return {
    uid,
    fullName: name,
    email,
    currentStage: 'Active Job Hunter',
    experienceYears: 3,
    primaryRole: 'Frontend Developer',
    experienceLevel: 'Intermediate',
    targetRoles: [
      {
        title: 'Frontend Developer',
        desc: 'Modern Web Architectures, React, TypeScript, State Management & Web Vitals',
        match: 92,
        reason: 'Focus on component architecture, state machines, and performant UI.',
      },
      {
        title: 'Full Stack Engineer',
        desc: 'End-to-End Delivery, API Integration, Auth & Databases',
        match: 86,
        reason: 'Fullstack versatility across Node.js and modern client frameworks.',
      }
    ],
    topSkills: ['React', 'TypeScript', 'JavaScript', 'CSS/Tailwind', 'REST APIs', 'Git'],
    targetCompanies: ['Google', 'Meta', 'Stripe', 'Vercel'],
    careerGoals: 'Master technical questions, articulate system design tradeoffs, and land a senior role.',
    preferredInterviewType: 'Technical',
    targetInterviewDate: '',
    readinessTier: 'Tier B+',
    keyAchievements: [
      'Delivered performant and accessible web features under tight deadlines',
      'Engineered reusable component libraries and robust API integrations'
    ],
    suggestedFocus: 'Refine quantitative STAR behavioral storytelling and deep architectural trade-offs.',
    summary: 'Candidate preparing for high-impact technical and behavioral interviews.'
  };
}

export function createDefaultSettings(_uid?: string): UserSettings {
  return {
    theme: 'system',
    interviewDefaults: {
      defaultRole: 'Frontend Developer',
      defaultLevel: 'Intermediate',
      defaultType: 'Technical',
      defaultDifficulty: 'Medium',
      duration: '20 min (5 questions)',
      questionsPerSession: 5,
      feedbackRigor: 'Calibrated',
    },
    notifications: {
      practiceReminders: true,
      weeklyProgressUpdates: true,
      productAnnouncements: false,
      frequency: 'weekly',
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      soundEffects: true,
    },
  };
}

/**
 * Loads the user profile for a given UID.
 * Checks server backend first, falls back to local user-scoped cache, or returns null.
 */
export async function loadUserProfile(uid: string, email?: string, displayName?: string): Promise<UserProfile> {
  if (!uid) throw new Error('Cannot load profile without authenticated UID');

  // Try fetching from server
  try {
    const res = await fetch(`/api/user/profile/${encodeURIComponent(uid)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.profile) {
        // Cache locally for offline fast load
        try {
          localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(data.profile));
        } catch (_e) {}
        return data.profile;
      }
    }
  } catch (err) {
    console.warn('Network request for profile failed, checking local cache:', err);
  }

  // Fallback to user-scoped local cache
  try {
    const local = localStorage.getItem(getProfileStorageKey(uid));
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local profile:', e);
  }

  // Create fresh default profile for this UID
  const newProfile = createDefaultProfile(uid, email || '', displayName);
  await saveUserProfile(newProfile);
  return newProfile;
}

/**
 * Saves profile updates to server, local storage, and syncs displayName to Firebase Auth.
 */
export async function saveUserProfile(profileOrUid: UserProfile | string, maybeProfile?: UserProfile): Promise<UserProfile> {
  const profile = typeof profileOrUid === 'string' ? maybeProfile! : profileOrUid;
  const uid = typeof profileOrUid === 'string' ? profileOrUid : profile.uid;
  if (!uid) throw new Error('Profile must contain user UID');

  const updatedProfile: UserProfile = {
    ...profile,
    uid,
    updatedAt: new Date().toISOString()
  };

  // Sync displayName to Firebase Auth if currentUser matches
  if (auth?.currentUser && auth.currentUser.uid === uid && profile.fullName) {
    if (auth.currentUser.displayName !== profile.fullName) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: profile.fullName.trim()
        });
      } catch (err) {
        console.warn('Could not update Firebase displayName:', err);
      }
    }
  }

  // Save to user-scoped local storage
  try {
    localStorage.setItem(getProfileStorageKey(uid), JSON.stringify(updatedProfile));
  } catch (e) {
    console.warn('Failed to save profile to localStorage:', e);
  }

  // Save to server
  try {
    const res = await fetch(`/api/user/profile/${encodeURIComponent(uid)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.profile) {
        return data.profile;
      }
    }
  } catch (err) {
    console.warn('Could not persist profile to server backend:', err);
  }

  return updatedProfile;
}

/**
 * Loads user settings for a given UID.
 */
export async function loadUserSettings(uid: string): Promise<UserSettings> {
  if (!uid) return createDefaultSettings();

  // Try fetching from server
  try {
    const res = await fetch(`/api/user/settings/${encodeURIComponent(uid)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        try {
          localStorage.setItem(getSettingsStorageKey(uid), JSON.stringify(data.settings));
        } catch (_e) {}
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Network request for settings failed, checking local cache:', err);
  }

  // Fallback to user-scoped local cache
  try {
    const local = localStorage.getItem(getSettingsStorageKey(uid));
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local settings:', e);
  }

  const defaultSettings = createDefaultSettings();
  await saveUserSettings(uid, defaultSettings);
  return defaultSettings;
}

/**
 * Saves user settings to server and local storage.
 */
export async function saveUserSettings(uid: string, settings: UserSettings): Promise<UserSettings> {
  if (!uid) throw new Error('Settings must be associated with user UID');

  const updatedSettings: UserSettings = {
    ...settings,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(getSettingsStorageKey(uid), JSON.stringify(updatedSettings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }

  try {
    const res = await fetch(`/api/user/settings/${encodeURIComponent(uid)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Could not persist settings to server backend:', err);
  }

  return updatedSettings;
}

/**
 * Exports user profile, settings, and interview statistics into a JSON download.
 */
export function exportUserData(profile: UserProfile, settings: UserSettings): void {
  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      uid: profile.uid,
      email: profile.email,
      fullName: profile.fullName,
      emailVerified: auth?.currentUser?.emailVerified ?? false,
      accountCreatedAt: auth?.currentUser?.metadata?.creationTime ?? null,
      lastSignInTime: auth?.currentUser?.metadata?.lastSignInTime ?? null,
    },
    careerProfile: {
      primaryRole: profile.primaryRole,
      experienceLevel: profile.experienceLevel,
      currentStage: profile.currentStage,
      experienceYears: profile.experienceYears,
      targetRoles: profile.targetRoles,
      topSkills: profile.topSkills,
      targetCompanies: profile.targetCompanies,
      careerGoals: profile.careerGoals,
      targetInterviewDate: profile.targetInterviewDate,
      summary: profile.summary,
    },
    preferences: settings,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interviewiq-data-export-${profile.uid || 'user'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Deletes user account: removes server data, local storage items, and calls Firebase deleteUser.
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  // Delete from server
  try {
    await fetch(`/api/user/data/${encodeURIComponent(uid)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Failed to delete user data from server:', err);
  }

  // Clean local storage for this user
  try {
    localStorage.removeItem(getProfileStorageKey(uid));
    localStorage.removeItem(getSettingsStorageKey(uid));
  } catch (_e) {}

  // Delete Firebase user
  if (auth?.currentUser) {
    try {
      await deleteUser(auth.currentUser);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        throw new Error('For security, deleting your account requires recent authentication. Please sign out, sign in again, and retry account deletion.');
      }
      throw err;
    }
  }
}
