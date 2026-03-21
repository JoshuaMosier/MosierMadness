<script lang="ts">
  export let className = '';
</script>

<div class={`bracket-frame ${className}`.trim()}>
  <slot />
</div>

<style>
  .bracket-frame {
    overflow: hidden;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    background: rgba(10, 10, 11, 0.96);
    box-shadow: var(--mm-shadow);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  @media (min-width: 768px) {
    .bracket-frame {
      padding: 1.35rem;
    }
  }
</style>
