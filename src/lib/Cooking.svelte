<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { formatElapsed } from './time.js';

  let { recipe, startedAt, ondone, oncancel } = $props();

  let now = $state(Date.now());
  let elapsed = $derived(formatElapsed(now - startedAt));

  onMount(() => {
    const tick = setInterval(() => (now = Date.now()), 500);

    // Keep the screen awake while cooking, where the browser supports it.
    let lock = null;
    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock?.request('screen');
      } catch {
        // Denied or unsupported; the timer still works.
      }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);

    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', acquire);
      lock?.release();
    };
  });
</script>

<section class="cooking" in:fly={{ y: 48, duration: 260 }}>
  <div class="content">
    <h1>{recipe.title}</h1>
    <div class="md">{@html recipe.html}</div>
  </div>

  <footer class="timer">
    <div class="row">
      <span class="label">Making it…</span>
      <span class="clock" aria-live="off">{elapsed}</span>
    </div>
    <div class="actions">
      <button class="cancel" onclick={oncancel}>Cancel</button>
      <button class="done" onclick={ondone}>Done</button>
    </div>
  </footer>
</section>

<style>
  .cooking {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--paper);
    color: var(--ink);
  }

  .content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 28px 20px 24px;
  }

  h1 {
    margin: 0 0 18px;
    font-family: var(--display);
    font-weight: 800;
    font-size: 34px;
    letter-spacing: -0.5px;
    line-height: 1.05;
  }

  .md {
    font-size: 16px;
    line-height: 1.5;
  }
  .md :global(h1),
  .md :global(h2),
  .md :global(h3) {
    margin: 20px 0 6px;
    font-family: var(--display);
    font-weight: 600;
    font-size: 19px;
  }
  .md :global(:first-child) {
    margin-top: 0;
  }
  .md :global(p),
  .md :global(ul),
  .md :global(ol) {
    margin: 0 0 10px;
  }
  .md :global(ul),
  .md :global(ol) {
    padding-left: 22px;
  }
  .md :global(li) {
    margin-bottom: 4px;
  }
  .md :global(a) {
    color: var(--accent-deep);
  }

  .timer {
    background: var(--ink);
    color: #fff;
    border-radius: 24px 24px 0 0;
    padding: 16px 16px calc(28px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .label {
    font-size: 14px;
    color: var(--muted);
  }
  .clock {
    font-family: var(--display);
    font-weight: 600;
    font-size: 34px;
    font-variant-numeric: tabular-nums;
  }

  .actions {
    display: flex;
    gap: 10px;
  }
  .actions button {
    height: 52px;
    border-radius: 14px;
    font-weight: 600;
    font-size: 16px;
    color: #fff;
  }
  .cancel {
    flex: 1;
    border: 1px solid var(--line);
    background: transparent;
  }
  .done {
    flex: 2;
    border: 0;
    background: var(--accent-deep);
  }
</style>
