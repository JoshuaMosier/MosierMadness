import type { Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const firstName = formData.get('firstName')?.toString()?.trim();
		const lastName = formData.get('lastName')?.toString()?.trim();
		const email = formData.get('email')?.toString()?.trim();
		const password = formData.get('password')?.toString()?.trim();

		if (!firstName || !lastName || !email || !password) {
			return fail(400, { error: 'All fields are required' });
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { first_name: firstName, last_name: lastName }
			}
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		if (!data.user) {
			return fail(500, { error: 'No user data returned from registration' });
		}

		// Sign in immediately after registration
		const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

		if (signInError) {
			return fail(500, { error: signInError.message });
		}

		throw redirect(303, '/');
	}
};
