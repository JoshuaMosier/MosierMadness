import { fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString()?.trim();

		if (!email) {
			return fail(400, { error: 'Email address is required' });
		}

		const redirectTo = `${url.origin}/auth/callback?next=/reset-password/update`;

		const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

		if (error) {
			return fail(400, { error: error.message });
		}

		return { success: true };
	}
};
