import { redirect, fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const password = formData.get('password')?.toString();
		const confirmPassword = formData.get('confirmPassword')?.toString();

		if (!password || !confirmPassword) {
			return fail(400, { error: 'Both fields are required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { error: error.message });
		}

		throw redirect(303, '/login?reset=success');
	}
};
