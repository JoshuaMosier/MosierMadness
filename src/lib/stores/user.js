import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase, createUserRecord } from '$lib/supabaseClient';

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
    // First, create the auth user
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
    
    if (error) {
      return { data, error };
    }
    
    // If auth signup was successful, create a record in the users table
    if (data?.user) {
      const { error: insertError } = await createUserRecord(data.user.id, {
        firstname,
        lastname,
        email
      });
      
      if (insertError) {
        console.error('Error creating user record:', insertError);
        return { data, error: insertError };
      }
      
      // Create default bracket entries for the user
      try {
        // Get current year
        const currentYear = new Date().getFullYear();
        
        // Create a default bracket for the current year
        const { error: bracketError } = await supabase
          .from('brackets')
          .insert([
            {
              user_id: data.user.id,
              year: currentYear,
              selections: []
            }
          ]);
        
        if (bracketError) {
          console.error('Error creating default bracket:', bracketError);
          // We don't want to fail registration if bracket creation fails
          // Just log the error and continue
        }
      } catch (bracketError) {
        console.error('Error in bracket creation:', bracketError);
        // Continue with registration even if bracket creation fails
      }
    }
    
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
  },
  
  // Create a user record for an existing auth user
  createUserRecord: async (firstname, lastname) => {
    let currentUser;
    userStore.subscribe(value => {
      currentUser = value;
    })();
    
    if (!currentUser) return { error: new Error('Not authenticated') };
    
    // Check if user record already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (existingUser) {
      return { data: existingUser, error: null };
    }
    
    // Create user record using the helper function
    return await createUserRecord(currentUser.id, {
      firstname: firstname || currentUser.user_metadata?.firstname || 'User',
      lastname: lastname || currentUser.user_metadata?.lastname || 'Name',
      email: currentUser.email
    });
  }
}; 