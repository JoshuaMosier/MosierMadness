import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importLatestScenarioArtifact } from '$lib/server/admin/scenarioImport';

export const POST: RequestHandler = async ({ locals }) => {
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

  try {
    const result = await importLatestScenarioArtifact();
    return json({
      ok: true,
      summary: result.summary,
    });
  } catch (error: unknown) {
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
};
