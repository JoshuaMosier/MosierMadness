<script lang="ts">
  export let type: 'error' | 'success' = 'error';
  export let message: string | null = null;
  export let compact: boolean = false;
  export let center: boolean = false;
  let className: string = '';
  export { className as class };
</script>

{#if message || $$slots.default}
  <div class="{type === 'error'
    ? 'bg-red-950/50 border border-red-900 text-red-400'
    : 'bg-green-950/50 border border-green-900 text-green-500'}
    {compact ? 'text-sm p-3' : 'p-4'}
    {center ? 'text-center' : ''}
    rounded-lg {className}">
    {#if message}
      {message}
    {:else}
      <slot />
    {/if}
  </div>
{/if}
