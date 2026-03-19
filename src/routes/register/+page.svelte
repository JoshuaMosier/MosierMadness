<script lang="ts">
  import { enhance } from '$app/forms';
  import Alert from '$lib/components/Alert.svelte';

  export let form;

  let loading = false;
</script>

<div class="mm-page flex min-h-[55vh] items-center justify-center">
  <div class="w-full max-w-md">
    <div class="mm-form-shell">
      <div class="mb-10 text-center">
        <div class="mm-section-badge">Pool Access</div>
        <h1 class="mm-section-title mt-4">Create Account</h1>
      </div>

      <form
        method="POST"
        class="space-y-6"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
      >
        <div>
          <label for="firstName" class="block text-sm font-medium text-zinc-300 mb-2">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            class="mm-input"
          />
        </div>

        <div>
          <label for="lastName" class="block text-sm font-medium text-zinc-300 mb-2">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            class="mm-input"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-zinc-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            class="mm-input"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-zinc-300 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            class="mm-input"
          />
        </div>

        <Alert message={form?.error} compact />

        <div>
          <button
            type="submit"
            disabled={loading}
            class="mm-button-primary flex w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <p class="mt-8 text-center text-sm text-zinc-400">
        Already have an account?
        <a href="/login" class="font-semibold text-amber-600 hover:text-amber-500 transition-colors duration-200">
          Sign in here
        </a>
      </p>
    </div>
  </div>
</div>
