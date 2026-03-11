<script>
  /** @type {'error' | 'success'} */
  export let type = 'error';
  /** @type {string | null} */
  export let message = null;
  /** @type {boolean} */
  export let compact = false;
  /** @type {boolean} */
  export let center = false;
  /** @type {string} */
  let className = '';
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
