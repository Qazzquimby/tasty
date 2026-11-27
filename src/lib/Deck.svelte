<script>
  import { fade } from 'svelte/transition';

  /** cards: the top few of the queue, top card first. */
  let { cards, onnext, onpick } = $props();

  const THRESHOLD = 90; // px of drag that commits a swipe
  const FLING_MS = 220;
  const TILT = -2.5; // resting tilt of the top card, from the mockup

  let dx = $state(0);
  let dragging = $state(false);
  let leaving = $state(0); // -1 flying left, 1 flying right, 0 idle
  let startX = 0;

  function down(e) {
    if (leaving) return;
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
    if (Math.abs(dx) > THRESHOLD) fling(Math.sign(dx));
    else dx = 0;
  }

  function fling(dir) {
    if (leaving || !cards.length) return;
    const slug = cards[0].slug;
    leaving = dir;
    dx = dir * (window.innerWidth + 200);
    setTimeout(() => {
      leaving = 0;
      dx = 0;
      if (dir > 0) onpick(slug);
      else onnext();
    }, FLING_MS);
  }

  function onkeydown(e) {
    if (e.key === 'ArrowLeft') fling(-1);
    else if (e.key === 'ArrowRight') fling(1);
  }

  // While the top card flies off, the ones behind it step forward.
  const depthOf = (i) => (i === 0 ? 0 : i - (leaving ? 1 : 0));

  function transformOf(i) {
    if (i === 0) return `translateX(${dx}px) rotate(${TILT + dx / 18}deg)`;
    const d = depthOf(i);
    return d === 0 ? `rotate(${TILT}deg)` : `translateY(${-d * 16}px) scale(${1 - d * 0.06})`;
  }
</script>

<svelte:window {onkeydown} />

<main class="screen">
  <header>
    <span class="brand">tasty<span class="dot">.</span></span>
  </header>

  <div class="stack">
    {#each cards as card, i (card.key)}
      <article
        class="card d{depthOf(i)}"
        class:dragging={i === 0 && dragging}
        style:transform={transformOf(i)}
        style:z-index={10 - i}
        aria-hidden={i > 0}
        onpointerdown={i === 0 ? down : undefined}
        onpointermove={i === 0 ? move : undefined}
        onpointerup={i === 0 ? up : undefined}
        onpointercancel={i === 0 ? up : undefined}
        in:fade={{ duration: 200 }}
      >
        {#if i === 0 && dx !== 0}
          <span class="stamp" style:opacity={Math.min(1, Math.abs(dx) / THRESHOLD)}>
            {dx > 0 ? 'Make it' : 'Next'}
          </span>
        {/if}
        <div class="face">
          <div class="time">{card.time}</div>
          <div>
            <h2>{card.title}</h2>
            {#if card.blurb}<p>{card.blurb}</p>{/if}
          </div>
        </div>
      </article>
    {:else}
      <p class="empty">No recipes yet. Add a markdown file to <code>recipes/</code>.</p>
    {/each}
  </div>

  <footer class="hints">
    <span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
      Swipe left for the next idea
    </span>
    <span>
      Swipe right to make it
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

  .card {
    position: absolute;
    inset: 30px 0 0 0;
    box-sizing: border-box;
    padding: 26px 24px;
    border-radius: 28px;
    color: var(--ink);
    touch-action: none;
    user-select: none;
    transition:
      transform 220ms ease,
      background-color 220ms ease;
  }
  .card.d0 {
    background: var(--accent);
    cursor: grab;
  }
  .card.d1 {
    background: #5b6157;
  }
  .card.d2 {
    background: #3a4037;
  }
  .card.dragging {
    transition: none;
    cursor: grabbing;
  }

  .face {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: opacity 220ms ease;
  }
  .card:not(.d0) .face {
    opacity: 0;
  }

  .time {
    align-self: flex-end;
    font-size: 15px;
    font-weight: 600;
  }

  h2 {
    margin: 0 0 12px;
    font-family: var(--display);
    font-weight: 800;
    font-size: clamp(40px, 13vw, 56px);
    line-height: 0.95;
    letter-spacing: -1.5px;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .face p {
    margin: 0;
    font-size: 16px;
    line-height: 1.45;
  }

  .stamp {
    position: absolute;
    top: 26px;
    left: 24px;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--ink);
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

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
  }
  .hints span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .face {
      transition-duration: 1ms;
    }
  }
</style>
