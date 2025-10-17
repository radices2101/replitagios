import { supabase } from './supabase.js';

export const auth = {
  currentUser: null,
  listeners: new Set(),

  init() {
    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        this.currentUser = session?.user || null;
        this.notifyListeners();
      })();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser = session?.user || null;
      this.notifyListeners();
    });
  },

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  },

  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  isAuthenticated() {
    return this.currentUser !== null;
  }
};

auth.init();
