<script>
  import { recipes } from './lib/recipes.js';
  import Deck from './lib/Deck.svelte';

  const bySlug = Object.fromEntries(recipes.map((r) => [r.slug, r]));

  // Each time a card is dealt it gets a fresh id, so a card cycling back
  // into the pile is a new element rather than one sliding in from offscreen.
  let nextId = 1;
  const deal = (slug) => ({ slug, id: nextId++ });

  function shuffled(items) {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let queue = $state(shuffled(recipes.map((r) => r.slug)).map(deal));
  let cards = $derived(queue.slice(0, 4).map((q) => ({ ...bySlug[q.slug], key: q.id })));

  function next() {
    const [top, ...rest] = queue;
    queue = [...rest, deal(top.slug)];
  }
</script>

<Deck {cards} onnext={next} />
