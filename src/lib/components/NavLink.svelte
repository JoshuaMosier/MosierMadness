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

<style>
  .nav-link {
    @apply flex-shrink-0;
    width: 132px;
  }

  .nav-button {
    @apply flex items-center justify-center relative px-4;
    height: 48px;
    width: 100%;
    font-size: 15px;
    font-weight: 500;
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    transition: all 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-button:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .nav-button:active {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(0);
  }

  .mobile-nav-button {
    @apply block w-full px-4 py-3 rounded-md text-white text-center;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-nav-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 1280px) {
    .nav-link {
      width: 160px;
    }
  }

  .nav-button.active {
    @apply bg-amber-400/20 border-amber-400/30;
  }

  .nav-button.active:hover {
    @apply bg-amber-400/30 border-amber-400/40;
  }

  .mobile-nav-button.active {
    @apply bg-amber-400/20 border-amber-400/30;
  }

  .mobile-nav-button.active:hover {
    @apply bg-amber-400/30;
  }

  .nav-button.disabled,
  .nav-button.disabled:hover {
    opacity: 0.35;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.05);
    transform: none;
  }

  .mobile-nav-button.disabled,
  .mobile-nav-button.disabled:hover {
    opacity: 0.35;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.05);
  }
</style>
