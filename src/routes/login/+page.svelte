<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import Alert from '$lib/components/Alert.svelte';

  export let form;

  let loading = false;
  $: resetSuccess = $page.url.searchParams.get('reset') === 'success';
</script>

<div class="mm-page flex min-h-[55vh] items-center justify-center">
  <div class="w-full max-w-md">
    <div class="mm-form-shell">
      <div class="mb-10 text-center">
        <div class="mm-section-badge">Account Access</div>
        <h1 class="mm-section-title mt-4">Sign In</h1>
      </div>
      {#if resetSuccess}
        <Alert type="success" compact class="mb-6">Password updated successfully. Sign in with your new password.</Alert>
      {/if}
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <div class="text-center">
          <a href="/reset-password" class="text-sm text-amber-600 hover:text-amber-500 transition-colors duration-200">
            Forgot your password?
          </a>
        </div>
      </form>

      <p class="mt-8 text-center text-sm text-zinc-400">
        Not a member?
        <a href="/register" class="font-semibold text-amber-600 hover:text-amber-500 transition-colors duration-200">
          Register here
        </a>
      </p>
    </div>
  </div>
</div>
