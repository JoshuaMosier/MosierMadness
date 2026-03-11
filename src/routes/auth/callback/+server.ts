import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { safeRedirectPath } from '$lib/utils/redirectUtils';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('redirect') ?? url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, safeRedirectPath(next));
		}
	}

	// Code exchange failed — redirect home with error
	throw redirect(303, '/?error_description=Reset+link+is+invalid+or+has+expired');
};
