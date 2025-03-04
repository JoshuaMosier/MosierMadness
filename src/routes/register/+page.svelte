<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  
  let firstname = '';
  let lastname = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let isSubmitting = false;
  let error = '';
  
  onMount(() => {
    // If user is already logged in, redirect to home
    if ($user) {
      goto('/');
    }
  });
  
  async function handleSubmit() {
    error = '';
    isSubmitting = true;
    
    // Validate form
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      error = 'Please fill out all fields';
      isSubmitting = false;
      return;
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      isSubmitting = false;
      return;
    }
    
    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      isSubmitting = false;
      return;
    }
    
    try {
      const { data, error: signUpError } = await user.signUp(email, password, firstname, lastname);
      
      if (signUpError) {
        error = signUpError.message;
      } else {
        // Redirect to login page after successful registration
        goto('/login');
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
        <h1 class="text-3xl font-bold text-amber-600 text-center">Register</h1>
      </div>
      
      <div class="px-6 py-6">
        {#if error}
          <div class="bg-red-900/50 border border-red-800 text-red-100 px-4 py-3 rounded text-sm mb-5" role="alert">
            <span>{error}</span>
          </div>
        {/if}
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="firstname" class="block text-zinc-300 text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                id="firstname"
                bind:value={firstname}
                class="w-full px-4 py-3 bg-zinc-900 bg-opacity-90 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 text-white placeholder-zinc-500"
                placeholder="First name"
                required
              />
            </div>
            
            <div>
              <label for="lastname" class="block text-zinc-300 text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                id="lastname"
                bind:value={lastname}
                class="w-full px-4 py-3 bg-zinc-900 bg-opacity-90 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 text-white placeholder-zinc-500"
                placeholder="Last name"
                required
              />
            </div>
          </div>
          
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
              placeholder="Create a password"
              required
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-zinc-300 text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              bind:value={confirmPassword}
              class="w-full px-4 py-3 bg-zinc-900 bg-opacity-90 border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-600 focus:border-amber-600 text-white placeholder-zinc-500"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div class="pt-2">
            <button
              type="submit"
              class="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded transition duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
          
          <div class="mt-4 text-xs text-zinc-400 text-center">
            <p>A default bracket will be created for you automatically.</p>
          </div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-zinc-400">
            Already have an account?
            <a href="/login" class="text-amber-500 hover:text-amber-400 hover:underline">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</div> 