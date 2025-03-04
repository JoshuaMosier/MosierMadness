import { redirect } from '@sveltejs/kit';

export function load() {
  // This ensures that if someone tries to access this page directly without JavaScript,
  // they will still be redirected to the home page
  throw redirect(302, '/');
} 