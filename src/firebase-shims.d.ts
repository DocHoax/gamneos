declare module 'firebase/app' {
  export interface FirebaseApp {
    readonly name: string;
  }

  export function initializeApp(config: Record<string, string | undefined>): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(): FirebaseApp;
}

declare module 'firebase/auth' {
  import type { FirebaseApp } from 'firebase/app';

  export interface Auth {
    readonly app: FirebaseApp;
    readonly currentUser: User | null;
  }

  export interface UserMetadata {
    creationTime?: string | null;
  }

  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    metadata: UserMetadata;
  }

  export interface UserCredential {
    user: User;
  }

  export function getAuth(app: FirebaseApp): Auth;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string | null }): Promise<void>;
  export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
}

declare module 'firebase/firestore' {
  import type { FirebaseApp } from 'firebase/app';

  export interface Firestore {
    readonly app: FirebaseApp;
  }

  export interface DocumentReference<T = unknown> {
    readonly path: string;
  }

  export interface DocumentSnapshot<T = unknown> {
    exists(): boolean;
    data(): T;
  }

  export interface Transaction {
    get<T = unknown>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
    set<T = unknown>(reference: DocumentReference<T>, data: T, options?: { merge?: boolean }): void;
  }

  export function getFirestore(app: FirebaseApp): Firestore;
  export function doc<T = unknown>(db: Firestore, collectionPath: string, documentPath: string): DocumentReference<T>;
  export function getDoc<T = unknown>(reference: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  export function setDoc<T = unknown>(reference: DocumentReference<T>, data: T, options?: { merge?: boolean }): Promise<void>;
  export function runTransaction<T>(db: Firestore, updateFunction: (transaction: Transaction) => Promise<T>): Promise<T>;
}
