/**
 * Remembers the last visited route so the user can resume where they
 * left off after a forced re-login (auth is inMemoryPersistence).
 */

const STORAGE_KEY = 'lastVisitedPath';

const EXCLUDED_PATHS = new Set([
  '/auth',
  '/forgot-password',
]);

/**
 * Persists the current path so it can be restored after re-login.
 * @param pathname The full path (path + search) to remember.
 */
export const saveLastVisitedPath = (pathname: string) => {
  try {
    if (
      pathname &&
      !EXCLUDED_PATHS.has(pathname)
    ) {
      sessionStorage.setItem(
        STORAGE_KEY,
        pathname
      );
    }
  } catch {
    // sessionStorage unavailable (e.g. private mode) - ignore.
  }
};

/**
 * Reads the last visited path, if any.
 * @returns The stored path or null when nothing was saved.
 */
export const readLastVisitedPath = (): string | null => {
  try {
    return sessionStorage.getItem(
      STORAGE_KEY
    );
  } catch {
    return null;
  }
};