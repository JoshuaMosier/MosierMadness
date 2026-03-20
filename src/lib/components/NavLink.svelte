<script lang="ts">
  export let href: string;
  export let label: string;
  export let disabled: boolean = false;
  export let disabledReason: string = '';
  export let active: boolean = false;
  export let mobile: boolean = false;
  export let onClick: (() => void) | null = null;

  $: desktopClass = `nav-button${active ? ' active' : ''}${disabled ? ' disabled' : ''}`;
  $: mobileClass = `mobile-nav-button${active ? ' active' : ''}${disabled ? ' disabled' : ''}`;
</script>

{#if mobile}
  {#if disabled}
    <span class={mobileClass} title={disabledReason} aria-label="{label} - {disabledReason}">{label}</span>
  {:else if onClick}
    <button type="button" on:click={onClick} class={mobileClass}>{label}</button>
  {:else}
    <a {href} class={mobileClass} on:click>{label}</a>
  {/if}
{:else}
  {#if disabled}
    <span class="nav-link" title={disabledReason} aria-label="{label} - {disabledReason}">
      <span class={desktopClass}>{label}</span>
    </span>
  {:else if onClick}
    <button type="button" on:click={onClick} class="nav-link">
      <span class={desktopClass}>{label}</span>
    </button>
  {:else}
    <a {href} class="nav-link">
      <span class={desktopClass}>{label}</span>
    </a>
  {/if}
{/if}

<style>
  .nav-link {
    display: inline-flex;
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    padding: 0;
    color: inherit;
    text-decoration: none;
  }

  .nav-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.7rem;
    padding: 0.62rem 1rem;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: var(--mm-muted);
    font-size: 0.94rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease;
  }

  .nav-button:hover {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.045);
    color: var(--mm-text);
  }

  .nav-button.active {
    border-color: rgba(245, 158, 11, 0.22);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.16), rgba(180, 83, 9, 0.08));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: #fde68a;
  }

  .nav-button.active:hover {
    border-color: rgba(245, 158, 11, 0.28);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.2), rgba(180, 83, 9, 0.1));
    color: #fef3c7;
  }

  .nav-button.disabled,
  .nav-button.disabled:hover {
    border-color: transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }

  .mobile-nav-button {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    min-height: 3.15rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
    color: var(--mm-text);
    font-size: 0.98rem;
    font-weight: 600;
    line-height: 1.15;
    text-decoration: none;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease;
  }

  .mobile-nav-button:hover {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.07);
  }

  .mobile-nav-button.active {
    border-color: rgba(245, 158, 11, 0.22);
    background: rgba(245, 158, 11, 0.12);
    color: #fde68a;
  }

  .mobile-nav-button.active:hover {
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(245, 158, 11, 0.16);
  }

  .mobile-nav-button.disabled,
  .mobile-nav-button.disabled:hover {
    border-color: rgba(255, 255, 255, 0.04);
    background: rgba(255, 255, 255, 0.02);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }
</style>
