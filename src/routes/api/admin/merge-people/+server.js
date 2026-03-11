import { json } from '@sveltejs/kit';
import { mergeDuplicatePeople } from '$lib/server/admin/mergePeople';

export async function POST({ locals, url }) {
  try {
    const { data: { user } } = await locals.supabase.auth.getUser();
    if (!user) {
      return json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return json({ error: 'Not authorized' }, { status: 403 });
    }

    const dryRun = url.searchParams.get('dry') === '1';
    const result = await mergeDuplicatePeople(locals.supabase, { dryRun });

    return json({ success: true, ...result });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
