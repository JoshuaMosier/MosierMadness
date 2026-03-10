<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'

  let password = ''
  let confirmPassword = ''
  let loading = false
  let error: string | null = null
  let sessionReady = false

  // Exchange the PKCE code for a session on mount
  onMount(async () => {
    const code = $page.url.searchParams.get('code')
    if (code) {
      const { error: err } = await supabase.auth.exchangeCodeForSession(code)
      if (err) {
        error = 'Reset link is invalid or has expired. Please request a new one.'
        return
      }
    }
    sessionReady = true
  })

  async function handlePasswordUpdate() {
    try {
      loading = true
      error = null

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const { error: err } = await supabase.auth.updateUser({
        password: password
      })

      if (err) throw err

      // Full reload to login with success message
      window.location.href = '/login?reset=success'
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<div class="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
  <div class="w-full max-w-md mx-auto px-4 sm:px-0">
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-8 shadow-lg border border-zinc-700">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold">
          <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
            Set New Password
          </span>
        </h1>
      </div>

      {#if !sessionReady && !error}
        <div class="text-center text-zinc-400 py-4">Verifying reset link...</div>
      {/if}
      <form class="space-y-6" on:submit|preventDefault={handlePasswordUpdate}>
        <div>
          <label for="password" class="block text-sm font-medium text-zinc-300 mb-2">
            New Password
          </label>
          <input
            bind:value={password}
            id="password"
            name="password"
            type="password"
            required
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-zinc-300 mb-2">
            Confirm New Password
          </label>
          <input
            bind:value={confirmPassword}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
          />
        </div>

        {#if error}
          <div class="text-red-500 text-sm bg-red-950/50 p-3 rounded-lg border border-red-900">{error}</div>
        {/if}

        <div>
          <button
            type="submit"
            disabled={loading || !sessionReady}
            class="flex w-full justify-center rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style> 