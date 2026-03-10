import { redirect, fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString()?.trim();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const { data, error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { error: error.message });
		}

		if (data.user) {
			throw redirect(303, url.searchParams.get('redirect') || '/');
		}

		return fail(500, { error: 'An unexpected error occurred' });
	}
};
