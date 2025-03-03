import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/services/auth';

// Create a writable store with initial value of null (not authenticated)
const userStore = writable(null);

// Only run this code in the browser
if (browser) {
  // Initialize auth state
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        userStore.set(session.user);
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          userStore.set(session.user);
        } else {
          userStore.set(null);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      userStore.set(null);
    }
  };

  // Run the initialization
  initAuth();
}

// Export the store
export const user = {
  subscribe: userStore.subscribe,
  set: userStore.set,
  update: userStore.update,
  signUp: async (email, password, firstname, lastname) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstname,
          lastname
        }
      }
    });
    
    return { data, error };
  },
  
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      userStore.set(null);
    }
    return { error };
  },
  
  getProfile: async () => {
    let user;
    userStore.subscribe(value => {
      user = value;
    })();
    
    if (!user) return { data: null, error: new Error('Not authenticated') };
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { data, error };
  }
}; 