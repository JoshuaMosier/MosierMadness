<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  let email = '';
  let password = '';
  let isSubmitting = false;
  let error = '';
  let redirectTo = '/';
  
  onMount(() => {
    // Check if there's a redirect parameter
    redirectTo = $page.url.searchParams.get('redirect') || '/';
    
    // If user is already logged in, redirect
    if ($user) {
      goto(redirectTo);
    }
  });
  
  async function handleSubmit() {
    error = '';
    isSubmitting = true;
    
    if (!email || !password) {
      error = 'Please enter both email and password';
      isSubmitting = false;
      return;
    }
    
    try {
      const { data, error: signInError } = await user.signIn(email, password);
      
      if (signInError) {
        error = signInError.message;
      } else {
        // Redirect after successful login
        goto(redirectTo);
      }
    } catch (err) {
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
  <div class="w-full max-w-md mx-auto px-4 sm:px-0">
    <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden text-zinc-100">
      <div class="px-6 py-6 border-b border-zinc-800">
        <h1 class="text-3xl font-bold text-amber-600 text-center">Sign In</h1>
      </div>
      
      <div class="px-6 py-6">
        {#if error}
          <div class="bg-red-900/50 border border-red-800 text-red-100 px-4 py-3 rounded text-sm mb-5" role="alert">
            <span>{error}</span>
          </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-5">
          <div>
            <label for="email" class="block text-zinc-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              bind:value={email}
              class="w-full px-4 py-3 bg-zinc-900 bg-opacity-90 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 text-white placeholder-zinc-500"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label for="password" class="block text-zinc-300 text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              id="password"
              bind:value={password}
              class="w-full px-4 py-3 bg-zinc-900 bg-opacity-90 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 text-white placeholder-zinc-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div class="pt-2">
            <button
              type="submit"
              class="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded transition duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-zinc-400">
            Don't have an account?
            <a href="/register" class="text-amber-500 hover:text-amber-400 hover:underline">Register</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div> 