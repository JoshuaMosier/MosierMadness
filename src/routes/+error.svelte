<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="mm-page py-16">
  <div class="max-w-md mx-auto text-center">
    <div class="mb-8">
      <h1 class="font-display text-8xl font-bold text-amber-400 md:text-9xl">{$page.status}</h1>
      <p class="mt-4 text-2xl text-zinc-300">
        {#if $page.status === 404}
          Page Not Found
        {:else}
          {$page.error?.message || 'Something went wrong'}
        {/if}
      </p>
    </div>
    
    <div class="card p-8">
      <p class="mb-6 text-zinc-300">
        {#if $page.status === 404}
          The page you're looking for doesn't exist or has been moved.
        {:else}
          We encountered an error while processing your request.
        {/if}
      </p>
      
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <a href="/" class="btn-primary">
          Go to Home
        </a>
        <button 
          on:click={() => history.back()} 
          class="btn-outline"
        >
          Go Back
        </button>
      </div>
      
      {#if $page.status !== 404}
        <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
          <p class="break-words font-mono text-sm text-zinc-300">
            {$page.error?.message || 'Unknown error'}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
