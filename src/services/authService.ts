import type { GameUser } from '../types';
import { createId, readJson, removeItem, writeJson } from '../lib/storage';
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

export async function getSessionUser(): Promise<GameUser | null> {
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
  ensureProgressRecord(user);
  return user;
}

export async function signIn(input: SignInInput): Promise<GameUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashSecret(input.password);
  const users = readUsers();
  const found = users.find((user) => user.email === email);

  if (!found || found.passwordHash !== passwordHash) {
    throw new Error('Invalid email or password.');
  }

  writeJson(SESSION_KEY, found.id);
  const user = toGameUser(found);
  ensureProgressRecord(user);
  return user;
}

export async function signOut(): Promise<void> {
  removeItem(SESSION_KEY);
}
