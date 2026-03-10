import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals: { supabase } }) {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, `/${next.slice(1)}`);
		}
	}

	// Code exchange failed — redirect home with error
	throw redirect(303, '/?error_description=Reset+link+is+invalid+or+has+expired');
}
