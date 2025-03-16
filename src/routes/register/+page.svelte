<!-- src/routes/register/+page.svelte -->
<script lang="ts">
  import { supabase } from '$lib/supabase'
  import { goto } from '$app/navigation'

  let firstName = ''
  let lastName = ''
  let email = ''
  let password = ''
  let loading = false
  let error: string | null = null

  async function handleRegister() {
    try {
      loading = true
      
      // Validate inputs
      if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
        throw new Error('All fields are required')
      }

      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          }
        }
      })

      if (err) {
        console.error('Registration error:', err)
        throw err
      }

      if (data.user) {
        // Sign in the user immediately after registration
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        })

        if (signInError) {
          throw signInError
        }

        // Redirect to the desired page after successful registration and sign in
        goto('/')  // or whatever path you want to redirect to
      } else {
        error = 'No user data returned from registration'
      }
    } catch (err) {
      console.error('Caught error:', err)
      error = err.message || 'An error occurred during registration'
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
            Create Account
          </span>
        </h1>
      </div>

      <form class="space-y-6" on:submit|preventDefault={handleRegister}>
        <div>
          <label for="firstName" class="block text-sm font-medium text-zinc-300 mb-2">
            First Name
          </label>
          <input
            bind:value={firstName}
            id="firstName"
            name="firstName"
            type="text"
            required
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
          />
        </div>

        <div>
          <label for="lastName" class="block text-sm font-medium text-zinc-300 mb-2">
            Last Name
          </label>
          <input
            bind:value={lastName}
            id="lastName"
            name="lastName"
            type="text"
            required
            class="block w-full rounded-lg border-0 bg-zinc-800 text-zinc-100 py-2.5 px-3 shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-amber-600 sm:text-sm"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-zinc-300 mb-2">
            Email address
          </label>
          <input
            bind:value={email}
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
            bind:value={password}
            id="password"
            name="password"
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
            disabled={loading}
            class="flex w-full justify-center rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

<style>
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
</style>