import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/services/auth';

// Create a writable store with initial value of null (not authenticated)
const userStore = writable(null);

// Initialize the store with the current session if available
if (browser) {
  // Get the current session
  supabase.auth.getSession().then(({ data }) => {
    if (data && data.session) {
      userStore.set(data.session.user);
    }
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      userStore.set(session.user);
    } else if (event === 'SIGNED_OUT') {
      userStore.set(null);
    }
  });
}

// Add custom methods to the store
const user = {
  ...userStore,
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

export { user }; 