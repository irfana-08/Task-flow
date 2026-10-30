/**
 * auth.js - Google Authentication Module
 * Real Google Sign-In powered by Firebase Authentication
 * Strict per-user task isolation in localStorage.
 */

const FIREBASE_CONFIG_STORAGE_KEY = 'todo_firebase_config';
const AUTH_USER_STORAGE_KEY = 'todo_current_user';

// Pre-configured with your Firebase project credentials
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCsQ2me2g6pjrrIS-3LIFEWSkp1_7aG4cw",
  authDomain: "to-do-list-82413.firebaseapp.com",
  projectId: "to-do-list-82413",
  storageBucket: "to-do-list-82413.firebasestorage.app",
  messagingSenderId: "1020384314818",
  appId: "1:1020384314818:web:e4b32f0145c0200d04825b",
  measurementId: "G-5K7LQCCSS2"
};

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.firebaseInitialized = false;
    this.authListeners = [];

    this.init();
  }

  init() {
    const config = this.getSavedFirebaseConfig();
    if (config && window.firebase) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(config);
        }
        this.firebaseInitialized = true;
        this.setupFirebaseListener();
      } catch (err) {
        console.warn('Firebase initialization notice:', err);
      }
    }

    // Restore cached session, clearing any old demo user
    const cachedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed && parsed.provider === 'google.demo') {
          localStorage.removeItem(AUTH_USER_STORAGE_KEY);
          this.currentUser = null;
        } else {
          this.currentUser = parsed;
        }
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  getSavedFirebaseConfig() {
    try {
      const cfg = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
      return cfg ? JSON.parse(cfg) : DEFAULT_FIREBASE_CONFIG;
    } catch {
      return DEFAULT_FIREBASE_CONFIG;
    }
  }

  saveFirebaseConfig(configObj) {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(configObj));
    if (window.firebase) {
      try {
        if (firebase.apps.length) {
          firebase.app().delete();
        }
        firebase.initializeApp(configObj);
        this.firebaseInitialized = true;
        this.setupFirebaseListener();
        return true;
      } catch (err) {
        console.error('Failed to init Firebase with provided config:', err);
        return false;
      }
    }
    return true;
  }

  setupFirebaseListener() {
    if (!this.firebaseInitialized || !window.firebase) return;
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || 'Google User',
          email: user.email || '',
          photoURL: user.photoURL || this.generateAvatarUrl(user.displayName || 'Google User'),
          provider: 'google.firebase'
        });
      } else {
        if (this.currentUser && this.currentUser.provider === 'google.firebase') {
          this.setCurrentUser(null);
        }
      }
    });
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
  }

  notifyListeners() {
    this.authListeners.forEach((cb) => cb(this.currentUser));
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    this.notifyListeners();
  }

  generateAvatarUrl(name) {
    const encoded = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encoded}&background=4285F4&color=fff&rounded=true&bold=true`;
  }

  /**
   * Real Google Sign-In using Firebase Auth Popup
   */
  async signInWithGoogle() {
    if (!this.firebaseInitialized && window.firebase) {
      const config = this.getSavedFirebaseConfig();
      if (config) {
        try {
          if (!firebase.apps.length) firebase.initializeApp(config);
          this.firebaseInitialized = true;
          this.setupFirebaseListener();
        } catch (e) {
          console.warn('Firebase init error:', e);
        }
      }
    }

    if (this.firebaseInitialized && window.firebase) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        const profile = {
          uid: user.uid,
          displayName: user.displayName || 'Google User',
          email: user.email,
          photoURL: user.photoURL || this.generateAvatarUrl(user.displayName || 'Google User'),
          provider: 'google.firebase'
        };
        this.setCurrentUser(profile);
        return { success: true, user: profile };
      } catch (error) {
        console.warn('Firebase popup sign-in error:', error);
        return { 
          success: false, 
          error: error.message || 'Firebase sign in failed', 
          code: error.code 
        };
      }
    } else {
      return {
        success: false,
        error: 'FIREBASE_NOT_CONFIGURED',
        message: 'Firebase configuration is needed for live Google OAuth popup.'
      };
    }
  }

  /**
   * Sign Out
   */
  async signOut() {
    if (this.firebaseInitialized && window.firebase && this.currentUser?.provider === 'google.firebase') {
      try {
        await firebase.auth().signOut();
      } catch (e) {
        console.warn('Firebase signout error:', e);
      }
    }
    this.setCurrentUser(null);
  }

  getUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }
}

// Global instance
window.authManager = new AuthManager();
