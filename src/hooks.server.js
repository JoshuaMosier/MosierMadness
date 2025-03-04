import { supabase } from '$lib/supabaseClient';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Get the session from the cookie
  const { data: { session } } = await supabase.auth.getSession();
  
  // If there is an active session, add the user to event.locals
  if (session) {
    event.locals.user = session.user;
    
    // Fetch additional user data if needed
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (userData) {
      event.locals.userData = userData;
    }
  }
  
  // Resolve the request
  const response = await resolve(event);
  return response;
} 