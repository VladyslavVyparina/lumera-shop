# LUMÉRA shop

A static preview of a German storefront for LUMÉRA compression leggings: product page, cart cues, and the payment marks the theme expects.

## Problem

The shop needed a visual draft of the product page before the theme was wired to a live catalog: name, fabric story, size choice, and the payment logos customers already recognize.

## What was built

- `preview.html` is the page. The title is “LUMÉRA – Premium Kompressionsleggings”.
- `logo_lumera.png` and `logo_lumera.svg` are the wordmark.
- `payment-logos/` holds the card and wallet marks used in the footer of the product block.
- `theme_export/` is the theme slice this preview was taken from, so the same markup can be compared with the shop theme.

## How it works

The preview is a fixed layout, not a cart. Buttons and prices are part of the HTML so the page can be reviewed without a store backend. Replacing a price or a size list is an edit in `preview.html`. The theme export is the reference for moving those blocks into the real shop.

## Stack

HTML, CSS, a theme export.

## Run locally

```bash
python3 -m http.server 8080
```

Open `preview.html`.
