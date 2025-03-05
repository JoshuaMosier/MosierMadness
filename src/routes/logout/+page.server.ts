import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error:', error.message)
  }
  throw redirect(303, '/')
}