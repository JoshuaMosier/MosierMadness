<script>
  import { page } from '$app/stores';
</script>

<div class="container mx-auto px-4 py-16">
  <div class="max-w-md mx-auto text-center">
    <div class="mb-8">
      <h1 class="text-9xl font-bold text-mm-blue">{$page.status}</h1>
      <p class="text-2xl text-mm-gray mt-4">
        {#if $page.status === 404}
          Page Not Found
        {:else}
          {$page.error?.message || 'Something went wrong'}
        {/if}
      </p>
    </div>
    
    <div class="card p-8">
      <p class="mb-6 text-mm-gray">
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
        <div class="mt-8 p-4 bg-gray-100 rounded-md text-left">
          <p class="text-sm font-mono text-gray-700 break-words">
            {$page.error?.message || 'Unknown error'}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div> 