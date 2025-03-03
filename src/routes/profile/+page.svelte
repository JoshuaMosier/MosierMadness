<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  import { bracketService } from '$lib/services/bracketService';
  
  let userBracket = null;
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    // If user is not logged in, redirect to login
    if (!$user) {
      goto('/login?redirectTo=/profile');
      return;
    }
    
    try {
      const { data, error: bracketError } = await bracketService.getUserBracket();
      
      if (bracketError) {
        error = bracketError.message;
      } else {
        userBracket = data;
      }
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-mm-blue mb-2">My Profile</h1>
      <p class="text-xl text-mm-gray">View and manage your account</p>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="loader"></div>
      </div>
    {:else if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <span class="block sm:inline">{error}</span>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- User Info Card -->
        <div class="card md:col-span-1">
          <div class="text-center mb-6">
            <div class="w-24 h-24 rounded-full bg-mm-blue text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {#if $user && $user.firstname && $user.lastname}
                {$user.firstname[0]}{$user.lastname[0]}
              {:else}
                U
              {/if}
            </div>
            <h2 class="text-2xl font-bold">
              {#if $user && $user.firstname && $user.lastname}
                {$user.firstname} {$user.lastname}
              {:else}
                User
              {/if}
            </h2>
            <p class="text-mm-gray">{$user ? $user.email : ''}</p>
          </div>
          
          <div class="border-t pt-4">
            <h3 class="font-semibold mb-2">Account Details</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-mm-gray">Member Since</span>
                <span>{$user && $user.created_at ? new Date($user.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-mm-gray">Brackets Submitted</span>
                <span>{userBracket ? '1' : '0'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bracket Status Card -->
        <div class="card md:col-span-2">
          <h2 class="text-2xl font-bold mb-4">My Bracket</h2>
          
          {#if userBracket}
            <div class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">Status</span>
                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Submitted</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">Submitted On</span>
                <span>{new Date(userBracket.created_at).toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">Current Score</span>
                <span class="text-xl font-bold text-mm-blue">{userBracket.score || 0}</span>
              </div>
            </div>
            
            <div class="mt-6">
              <a href="/bracket" class="btn-secondary w-full block text-center">View My Bracket</a>
            </div>
          {:else}
            <div class="py-8 text-center">
              <p class="text-mm-gray mb-4">You haven't submitted a bracket yet.</p>
              <a href="/bracket" class="btn-primary">Fill Out My Bracket</a>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Logout Button -->
      <div class="mt-8 text-center">
        <button 
          class="btn-outline"
          on:click={() => {
            user.signOut();
            goto('/login');
          }}
        >
          Sign Out
        </button>
      </div>
    {/if}
  </div>
</div> 