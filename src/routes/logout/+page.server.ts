import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error:', error.message);
  }
  throw redirect(303, '/');
};
