import { UserLearningProgress } from '../types/learning';

function getLearningStorageKey(uid: string): string {
  return `interviewiq_learning_${uid || 'guest'}`;
}

export function createDefaultLearningProgress(uid: string): UserLearningProgress {
  return {
    uid: uid || 'guest',
    bookmarkedResourceIds: ['res-react-docs-hooks', 'res-ts-handbook-generics'],
    completedResourceIds: [],
    inProgressResourceIds: [
      {
        resourceId: 'res-react-docs-hooks',
        startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        lastAccessedAt: new Date().toISOString(),
        progressPercent: 65
      }
    ],
    dismissedResourceIds: [],
    completedPathStepIds: {
      'path-frontend-fundamentals': [1]
    },
    updatedAt: new Date().toISOString()
  };
}

/**
 * Loads learning progress for a specific UID.
 * Checks server backend first, falls back to local user-scoped cache, or creates defaults.
 */
export async function loadUserLearningProgress(uid: string): Promise<UserLearningProgress> {
  const safeUid = uid || 'guest';

  // 1. Try server backend if running in browser environment
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/user/learning/${encodeURIComponent(safeUid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.progress) {
          try {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(getLearningStorageKey(safeUid), JSON.stringify(data.progress));
            }
          } catch (_e) {}
          return data.progress;
        }
      }
    } catch (err) {
      console.warn('Network request for learning progress failed, using local cache:', err);
    }
  }

  // 2. Check local storage if in browser
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const local = localStorage.getItem(getLearningStorageKey(safeUid));
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local learning progress:', e);
    }
  }

  // 3. Create fresh default progress
  const initial = createDefaultLearningProgress(safeUid);
  await saveUserLearningProgress(initial);
  return initial;
}

/**
 * Saves user learning progress to local cache and server backend.
 */
export async function saveUserLearningProgress(progress: UserLearningProgress): Promise<UserLearningProgress> {
  const safeUid = progress.uid || 'guest';
  const updated: UserLearningProgress = {
    ...progress,
    uid: safeUid,
    updatedAt: new Date().toISOString()
  };

  // Cache locally if in browser
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(getLearningStorageKey(safeUid), JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save learning progress to localStorage:', e);
    }
  }

  // Sync to server backend if in browser
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/user/learning/${encodeURIComponent(safeUid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: updated })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.progress) return data.progress;
      }
    } catch (err) {
      console.warn('Could not persist learning progress to server backend:', err);
    }
  }

  return updated;
}

/**
 * Toggles bookmark status of a resource
 */
export async function toggleBookmarkResource(
  current: UserLearningProgress,
  resourceId: string
): Promise<UserLearningProgress> {
  const exists = current.bookmarkedResourceIds.includes(resourceId);
  const updatedIds = exists
    ? current.bookmarkedResourceIds.filter(id => id !== resourceId)
    : [...current.bookmarkedResourceIds, resourceId];

  const updated: UserLearningProgress = {
    ...current,
    bookmarkedResourceIds: updatedIds
  };
  return saveUserLearningProgress(updated);
}

/**
 * Marks a resource as completed or uncompleted
 */
export async function markResourceComplete(
  current: UserLearningProgress,
  resourceId: string,
  completed = true
): Promise<UserLearningProgress> {
  let updatedCompleted = [...current.completedResourceIds];
  if (completed) {
    if (!updatedCompleted.includes(resourceId)) {
      updatedCompleted.push(resourceId);
    }
  } else {
    updatedCompleted = updatedCompleted.filter(id => id !== resourceId);
  }

  // Remove from in-progress if completed
  const updatedInProgress = completed
    ? current.inProgressResourceIds.filter(item => item.resourceId !== resourceId)
    : current.inProgressResourceIds;

  const updated: UserLearningProgress = {
    ...current,
    completedResourceIds: updatedCompleted,
    inProgressResourceIds: updatedInProgress
  };
  return saveUserLearningProgress(updated);
}

/**
 * Marks a resource as in-progress
 */
export async function markResourceInProgress(
  current: UserLearningProgress,
  resourceId: string
): Promise<UserLearningProgress> {
  const existingIdx = current.inProgressResourceIds.findIndex(item => item.resourceId === resourceId);
  let updatedList = [...current.inProgressResourceIds];

  if (existingIdx >= 0) {
    updatedList[existingIdx] = {
      ...updatedList[existingIdx],
      lastAccessedAt: new Date().toISOString()
    };
  } else {
    updatedList.push({
      resourceId,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      progressPercent: 10
    });
  }

  const updated: UserLearningProgress = {
    ...current,
    inProgressResourceIds: updatedList
  };
  return saveUserLearningProgress(updated);
}

/**
 * Dismisses a recommendation
 */
export async function dismissRecommendation(
  current: UserLearningProgress,
  resourceId: string
): Promise<UserLearningProgress> {
  if (current.dismissedResourceIds.includes(resourceId)) return current;
  const updated: UserLearningProgress = {
    ...current,
    dismissedResourceIds: [...current.dismissedResourceIds, resourceId]
  };
  return saveUserLearningProgress(updated);
}

/**
 * Toggles completion of a step in a learning path
 */
export async function togglePathStepComplete(
  current: UserLearningProgress,
  pathId: string,
  stepNumber: number
): Promise<UserLearningProgress> {
  const currentSteps = current.completedPathStepIds[pathId] || [];
  const exists = currentSteps.includes(stepNumber);
  const updatedSteps = exists
    ? currentSteps.filter(s => s !== stepNumber)
    : [...currentSteps, stepNumber];

  const updated: UserLearningProgress = {
    ...current,
    completedPathStepIds: {
      ...current.completedPathStepIds,
      [pathId]: updatedSteps
    }
  };
  return saveUserLearningProgress(updated);
}
