import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GameUser } from '../types';
import { createId, readJson, removeItem, writeJson } from '../lib/storage';
import { firebaseReady, getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import { ensureProgressRecord } from './progressService';

const USERS_KEY = 'gamneos.users';
const SESSION_KEY = 'gamneos.session';

type StoredCredential = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: GameUser['role'];
  joinedAt: string;
};

interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
}

interface SignInInput {
  email: string;
  password: string;
}

type StoredProfile = {
  id: string;
  email: string;
  displayName: string;
  role: GameUser['role'];
  joinedAt: string;
};

async function hashSecret(value: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return value;
}

function readUsers(): StoredCredential[] {
  return readJson<StoredCredential[]>(USERS_KEY, []);
}

function writeUsers(users: StoredCredential[]): void {
  writeJson(USERS_KEY, users);
}

function toGameUser(user: StoredCredential): GameUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    joinedAt: user.joinedAt,
  };
}

function toGameUserFromProfile(profile: StoredProfile): GameUser {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    role: profile.role,
    joinedAt: profile.joinedAt,
  };
}

function getUserProfileRef(userId: string) {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not configured.');
  }

  return doc(db, 'users', userId);
}

async function readFirebaseUserProfile(user: FirebaseUser): Promise<GameUser> {
  const profileRef = getUserProfileRef(user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return toGameUserFromProfile(snapshot.data() as StoredProfile);
  }

  const profile: StoredProfile = {
    id: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Mission Operator',
    role: 'player',
    joinedAt: user.metadata.creationTime ?? new Date().toISOString(),
  };

  await setDoc(profileRef, profile, { merge: true });
  return toGameUserFromProfile(profile);
}

async function waitForFirebaseSession(): Promise<GameUser | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  return new Promise<GameUser | null>((resolve) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();

      if (!firebaseUser) {
        resolve(null);
        return;
      }

      resolve(await readFirebaseUserProfile(firebaseUser));
    });
  });
}

export async function getSessionUser(): Promise<GameUser | null> {
  if (firebaseReady) {
    return waitForFirebaseSession();
  }

  const sessionId = readJson<string | null>(SESSION_KEY, null);
  if (!sessionId) {
    return null;
  }

  const found = readUsers().find((user) => user.id === sessionId);
  return found ? toGameUser(found) : null;
}

export async function signUp(input: SignUpInput): Promise<GameUser> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (firebaseReady) {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth is unavailable.');
    }

    const credentials = await createUserWithEmailAndPassword(auth, email, input.password);
    await updateProfile(credentials.user, { displayName });

    const user = await readFirebaseUserProfile(credentials.user);
    await ensureProgressRecord(user);
    return user;
  }

  const users = readUsers();

  if (users.some((user) => user.email === email)) {
    throw new Error('An account with that email already exists.');
  }

  const stored: StoredCredential = {
    id: createId(),
    email,
    displayName,
    passwordHash: await hashSecret(input.password),
    role: 'player',
    joinedAt: new Date().toISOString(),
  };

  users.unshift(stored);
  writeUsers(users);
  writeJson(SESSION_KEY, stored.id);
  const user = toGameUser(stored);
  await ensureProgressRecord(user);
  return user;
}

export async function signIn(input: SignInInput): Promise<GameUser> {
  const email = input.email.trim().toLowerCase();

  if (firebaseReady) {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error('Firebase Auth is unavailable.');
    }

    const credentials = await signInWithEmailAndPassword(auth, email, input.password);
    const user = await readFirebaseUserProfile(credentials.user);
    await ensureProgressRecord(user);
    return user;
  }

  const passwordHash = await hashSecret(input.password);
  const users = readUsers();
  const found = users.find((user) => user.email === email);

  if (!found || found.passwordHash !== passwordHash) {
    throw new Error('Invalid email or password.');
  }

  writeJson(SESSION_KEY, found.id);
  const user = toGameUser(found);
  await ensureProgressRecord(user);
  return user;
}

export async function signOut(): Promise<void> {
  if (firebaseReady) {
    const auth = getFirebaseAuth();
    if (auth) {
      await firebaseSignOut(auth);
      return;
    }
  }

  removeItem(SESSION_KEY);
}

export function listKnownUsers(): Record<string, Pick<GameUser, 'displayName' | 'email'>> {
  if (firebaseReady) {
    // Firebase user directory should be queried server-side in shared deployments.
    return {};
  }

  const users = readUsers();
  const byId: Record<string, Pick<GameUser, 'displayName' | 'email'>> = {};

  for (const u of users) {
    byId[u.id] = {
      displayName: u.displayName,
      email: u.email,
    };
  }

  return byId;
}
