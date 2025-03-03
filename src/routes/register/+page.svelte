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

<div class="container mx-auto px-4 py-8">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-mm-blue mb-2">Register</h1>
      <p class="text-xl text-mm-gray">Create your Mosier Madness account</p>
    </div>
    
    <div class="card">
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span class="block sm:inline">{error}</span>
        </div>
      {/if}
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstname" class="block text-mm-gray font-medium mb-1">First Name</label>
            <input
              type="text"
              id="firstname"
              bind:value={firstname}
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mm-blue"
              placeholder="First name"
              required
            />
          </div>
          
          <div>
            <label for="lastname" class="block text-mm-gray font-medium mb-1">Last Name</label>
            <input
              type="text"
              id="lastname"
              bind:value={lastname}
              class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mm-blue"
              placeholder="Last name"
              required
            />
          </div>
        </div>
        
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
            placeholder="Create a password"
            required
          />
        </div>
        
        <div>
          <label for="confirmPassword" class="block text-mm-gray font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-mm-blue"
            placeholder="Confirm your password"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            class="w-full btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-mm-gray">
          Already have an account?
          <a href="/login" class="text-mm-blue hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  </div>
</div> 