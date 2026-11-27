# tasty

Suggests something to make and lets you pick one. Swipe left for the next idea, swipe right to flip the card over and read the recipe (arrow keys and Esc work on desktop).

## Recipes

Each recipe is a markdown file in `recipes/`. The file name becomes its id, and the frontmatter is shown on the card:

```markdown
---
title: Crispy chickpeas
time: ~20 min
blurb: Air fryer, paprika, salt. Shake halfway.
---

## Ingredients
...
```

Everything after the frontmatter goes on the back of the card. Commit the file and the site rebuilds.

## Development

```sh
npm install
npm run dev
```

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` (set Pages' source to "GitHub Actions" in the repo settings once).
