<script>
  /** @type {string} */
  export let href;
  /** @type {string} */
  export let label;
  /** @type {boolean} */
  export let disabled = false;
  /** @type {string} */
  export let disabledReason = '';
  /** @type {boolean} */
  export let active = false;
  /** @type {boolean} */
  export let mobile = false;
  /** @type {(() => void) | null} */
  export let onClick = null;
</script>

{#if mobile}
  {#if disabled}
    <span class="mobile-nav-button disabled" title={disabledReason} aria-label="{label} - {disabledReason}">{label}</span>
  {:else if onClick}
    <button on:click={onClick} class="mobile-nav-button w-full {active ? 'active' : ''}">{label}</button>
  {:else}
    <a {href} class="mobile-nav-button {active ? 'active' : ''}" on:click>{label}</a>
  {/if}
{:else}
  {#if disabled}
    <span class="nav-link" title={disabledReason} aria-label="{label} - {disabledReason}">
      <div class="nav-button disabled">{label}</div>
    </span>
  {:else if onClick}
    <button on:click={onClick} class="nav-link">
      <div class="nav-button {active ? 'active' : ''}">{label}</div>
    </button>
  {:else}
    <a {href} class="nav-link">
      <div class="nav-button {active ? 'active' : ''}">{label}</div>
    </a>
  {/if}
{/if}
