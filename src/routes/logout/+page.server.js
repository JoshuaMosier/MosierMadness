import { redirect } from '@sveltejs/kit'

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals: { supabase } }) => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error:', error.message)
  }
  throw redirect(303, '/')
}