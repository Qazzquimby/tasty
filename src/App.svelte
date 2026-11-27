<script>
  import { fade } from 'svelte/transition';
  import { recipes } from './lib/recipes.js';
  import { formatElapsed } from './lib/time.js';
  import Deck from './lib/Deck.svelte';
  import Cooking from './lib/Cooking.svelte';

  const SESSION_KEY = 'tasty:cooking';
  const bySlug = Object.fromEntries(recipes.map((r) => [r.slug, r]));

  // Each time a card is dealt it gets a fresh id, so a card cycling back
  // into the stack is a new element rather than one sliding in from offscreen.
  let nextId = 0;
  const deal = (slug) => ({ slug, id: nextId++ });

  function shuffled(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // A recipe in progress survives a reload, so the timer keeps counting.
  function loadSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s && bySlug[s.slug] ? s : null;
    } catch {
      return null;
    }
  }

  let queue = $state(shuffled(recipes.map((r) => r.slug)).map(deal));
  let session = $state(loadSession());
  let toast = $state('');
  let toastTimer;

  let cards = $derived(queue.slice(0, 3).map((q) => ({ ...bySlug[q.slug], key: q.id })));

  function sendToBack(slug) {
    queue = [...queue.filter((q) => q.slug !== slug), deal(slug)];
  }

  function start(slug) {
    session = { slug, startedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function end(made) {
    const { slug, startedAt } = session;
    if (made) {
      toast = `${bySlug[slug].title}, made in ${formatElapsed(Date.now() - startedAt)}`;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (toast = ''), 3500);
    }
    session = null;
    localStorage.removeItem(SESSION_KEY);
    sendToBack(slug);
  }
</script>

{#if session}
  <Cooking
    recipe={bySlug[session.slug]}
    startedAt={session.startedAt}
    ondone={() => end(true)}
    oncancel={() => end(false)}
  />
{:else}
  <Deck {cards} onnext={() => sendToBack(queue[0].slug)} onpick={start} />
  {#if toast}
    <p class="toast" role="status" transition:fade={{ duration: 200 }}>{toast}</p>
  {/if}
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    top: 72px;
    transform: translateX(-50%);
    margin: 0;
    max-width: calc(100vw - 40px);
    width: max-content;
    padding: 10px 16px;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-size: 14px;
    font-weight: 600;
    z-index: 50;
  }
</style>
