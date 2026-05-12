const canUseStorage = typeof window !== 'undefined' && Boolean(window.localStorage);

export function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  if (!canUseStorage) {
    return;
  }

  window.localStorage.removeItem(key);
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Math.random().toString(36).slice(2, 11)}`;
}
