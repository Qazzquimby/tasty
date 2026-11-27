<script>
  import { fade } from 'svelte/transition';

  /** cards: the top few of the queue, top card first. */
  let { cards, onnext } = $props();

  const THRESHOLD = 90; // px of drag that commits a swipe
  const FLING_MS = 240;
  const TILT = -2; // resting tilt of the top card

  let dx = $state(0);
  let dragging = $state(false);
  let leaving = $state(false);
  let flipped = $state(false);
  let startX = 0;

  function down(e) {
    if (leaving || flipped) return;
    dragging = true;
    startX = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (dragging) dx = e.clientX - startX;
  }

  function up() {
    if (!dragging) return;
    dragging = false;
    if (dx > THRESHOLD) flip();
    else if (dx < -THRESHOLD) next();
    else dx = 0;
  }

  function flip() {
    dx = 0;
    flipped = true;
  }

  function next() {
    if (leaving || !cards.length) return;
    leaving = true;
    dx = -(window.innerWidth + 200);
    setTimeout(() => {
      leaving = false;
      dx = 0;
      onnext();
    }, FLING_MS);
  }

  function onkeydown(e) {
    if (flipped) {
      if (e.key === 'Escape' || e.key === 'ArrowLeft') flipped = false;
    } else if (e.key === 'ArrowLeft') next();
    else if (e.key === 'ArrowRight') flip();
  }

  // Every dealt card gets its own messy resting angle and offset, seeded from its key
  // so it stays put while it sits in the pile.
  function scatter(key) {
    let r = ((key * 7919) % 13) - 6;
    if (Math.abs(r) < 2) r = r < 0 ? -3 : 3;
    return { r, x: ((key * 104729) % 13) - 6, y: ((key * 15485863) % 9) - 2 };
  }

  // While the top card flies off, the next one steps up and straightens.
  const depthOf = (i) => (i === 0 ? 0 : i - (leaving ? 1 : 0));

  function transformOf(card, i) {
    if (i === 0) {
      return flipped ? 'none' : `translateX(${dx}px) rotate(${TILT + dx / 18}deg)`;
    }
    if (depthOf(i) === 0) return `rotate(${TILT}deg)`;
    const s = scatter(card.key);
    return `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`;
  }
</script>

<svelte:window {onkeydown} />

<main class="screen">
  <header>
    <span class="brand">tasty<span class="dot">.</span></span>
  </header>

  <div class="stack">
    {#each cards as card, i (card.key)}
      {@const top = i === 0}
      <article
        class="card"
        class:top
        class:dragging={top && dragging}
        class:flipped={top && flipped}
        style:transform={transformOf(card, i)}
        style:z-index={10 - i}
        style:--shade={1 - depthOf(i) * 0.1}
        aria-hidden={!top}
        onpointerdown={top ? down : undefined}
        onpointermove={top ? move : undefined}
        onpointerup={top ? up : undefined}
        onpointercancel={top ? up : undefined}
        in:fade={{ duration: 200 }}
      >
        <div class="flipper">
          <div class="front" aria-hidden={top && flipped}>
            {#if card.time}
              <span class="index tl">{card.time}</span>
              <span class="index br">{card.time}</span>
            {/if}
            <div class="title">
              <h2>{card.title}</h2>
              {#if card.blurb}<p>{card.blurb}</p>{/if}
            </div>
            {#if top && dx !== 0}
              <span class="stamp" style:opacity={Math.min(1, Math.abs(dx) / THRESHOLD)}>
                {dx > 0 ? 'Make it' : 'Next'}
              </span>
            {/if}
          </div>

          {#if top}
            <div class="back" aria-hidden={!flipped}>
              <div class="recipe">
                <h2>{card.title}</h2>
                {#if card.time}<p class="time">{card.time}</p>{/if}
                {#if card.blurb}<p class="blurb">{card.blurb}</p>{/if}
                {#if card.html.trim()}<div class="md">{@html card.html}</div>{/if}
              </div>
              <button class="return" onclick={() => (flipped = false)} tabindex={flipped ? 0 : -1}>
                Back
              </button>
            </div>
          {/if}
        </div>
      </article>
    {:else}
      <p class="empty">No recipes yet. Add a markdown file to <code>recipes/</code>.</p>
    {/each}
  </div>

  <footer class="hints" class:hidden={flipped}>
    <span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
      Next
    </span>
    <span>
      Make it
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </span>
  </footer>
</main>

<style>
  .screen {
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 24px 20px 28px;
    overflow: hidden;
  }

  .brand {
    font-family: var(--display);
    font-weight: 800;
    font-size: 26px;
  }
  .dot {
    color: var(--accent);
  }

  .stack {
    flex-grow: 1;
    position: relative;
  }

  /* ---- the card ---- */

  .card {
    position: absolute;
    inset: 26px 22px 14px;
    perspective: 1800px;
    touch-action: none;
    user-select: none;
    transition: transform 240ms ease;
  }
  .card.top {
    cursor: grab;
  }
  .card.dragging {
    transition: none;
    cursor: grabbing;
  }
  .card.flipped {
    touch-action: pan-y;
    user-select: text;
    cursor: auto;
  }

  .flipper {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transition: transform 520ms cubic-bezier(0.3, 0.7, 0.3, 1);
  }
  .flipped .flipper {
    transform: rotateY(180deg);
  }

  .front,
  .back {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border-radius: 26px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.3),
      0 14px 32px rgba(0, 0, 0, 0.35);
  }

  /* front: playing-card layout, title in the middle, time as corner indices */
  .front {
    background: var(--accent);
    filter: brightness(var(--shade, 1));
    transition: filter 240ms ease;
    color: var(--ink);
    display: flex;
    align-items: center;
    padding: 56px 28px;
  }
  .front::before {
    content: '';
    position: absolute;
    inset: 12px;
    border: 1.5px solid rgba(28, 31, 27, 0.28);
    border-radius: 18px;
    pointer-events: none;
  }

  .title h2 {
    margin: 0 0 14px;
    font-family: var(--display);
    font-weight: 800;
    font-size: clamp(40px, 12vw, 54px);
    line-height: 0.95;
    letter-spacing: -1.5px;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .title p {
    margin: 0 auto;
    max-width: 24ch;
    font-size: 16px;
    line-height: 1.45;
  }

  .index {
    position: absolute;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .index.tl {
    top: 24px;
    left: 26px;
  }
  .index.br {
    bottom: 24px;
    right: 26px;
    transform: rotate(180deg);
  }

  .stamp {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 10px;
    border-radius: 7px;
    background: var(--ink);
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* back: the recipe, on a dark card so it stays in the deck's world */
  .back {
    transform: rotateY(180deg);
    background: #2a2e28;
    color: var(--paper);
    border: 1px solid #3a4037;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .recipe {
    flex-grow: 1;
    overflow-y: auto;
    padding: 28px 24px 12px;
    /* Centre short content vertically; auto margins fall back to top-aligned
       (and scrollable) once the recipe is taller than the card. */
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  .recipe > :global(:first-child) {
    margin-top: auto;
  }
  .recipe > :global(:last-child) {
    margin-bottom: auto;
  }
  .blurb {
    margin: 16px 0 0;
    font-size: 17px;
    line-height: 1.5;
  }
  .recipe h2 {
    margin: 0;
    font-family: var(--display);
    font-weight: 800;
    font-size: 32px;
    letter-spacing: -0.5px;
    line-height: 1.05;
    color: var(--accent);
  }
  .time {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--muted);
  }

  .md {
    margin-top: 18px;
    font-size: 16px;
    line-height: 1.55;
  }
  .md :global(h1),
  .md :global(h2),
  .md :global(h3) {
    margin: 22px 0 6px;
    font-family: var(--display);
    font-weight: 600;
    font-size: 18px;
    color: var(--paper);
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
  .md :global(li::marker) {
    color: var(--accent);
  }
  .md :global(a) {
    color: var(--accent);
  }

  .return {
    margin: 8px 16px 16px;
    height: 52px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--paper);
    font-weight: 600;
    font-size: 16px;
  }

  /* ---- chrome ---- */

  .empty {
    margin: 30px 0 0;
    color: var(--muted);
    line-height: 1.5;
  }

  .hints {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: var(--muted);
    transition: opacity 200ms ease;
  }
  .hints.hidden {
    opacity: 0;
  }
  .hints span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .flipper {
      transition-duration: 1ms;
    }
  }
</style>
