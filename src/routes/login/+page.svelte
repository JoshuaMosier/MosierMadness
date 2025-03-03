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

<div class="container mx-auto px-4 py-8">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-mm-blue mb-2">Sign In</h1>
      <p class="text-xl text-mm-gray">Access your Mosier Madness account</p>
    </div>
    
    <div class="card">
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
          <label for="email" class="block text-mm-gray font-medium mb-1">Email</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mm-blue"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div>
          <label for="password" class="block text-mm-gray font-medium mb-1">Password</label>
          <input
            type="password"
            id="password"
            bind:value={password}
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mm-blue"
            placeholder="Enter your password"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            class="w-full btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-mm-gray">
          Don't have an account?
          <a href="/register" class="text-mm-blue hover:underline">Register</a>
        </p>
      </div>
    </div>
  </div>
</div> 