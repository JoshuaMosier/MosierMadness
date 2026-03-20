import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createScenarioExport } from '$lib/server/admin/scenarioExport';

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
    const result = await createScenarioExport();
    return json({
      ok: true,
      fileName: result.fileName,
      payload: result.payload,
      writtenPath: result.writtenPath,
      writeError: result.writeError,
    });
  } catch (error: unknown) {
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
};
