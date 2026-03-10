<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';

  export let form;

  let loading = false;
  $: resetSuccess = $page.url.searchParams.get('reset') === 'success';
</script>

<div class="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
  <div class="w-full max-w-md mx-auto px-4 sm:px-0">
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 shadow-lg border border-zinc-700">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold">
          <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
            Sign In
          </span>
        </h1>
      </div>
      {#if resetSuccess}
        <div class="text-green-500 text-sm bg-green-950/50 p-3 rounded-lg border border-green-900 mb-6">
          Password updated successfully. Sign in with your new password.
        </div>
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
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
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
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
          />
        </div>

        {#if form?.error}
          <div class="text-red-500 text-sm bg-red-950/50 p-3 rounded-lg border border-red-900">{form.error}</div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={loading}
            class="flex w-full justify-center rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
