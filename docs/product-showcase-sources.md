# Product showcase — 17 September 2026

Baseline saved in `.design-backups/before-product-showcase-20260917/` before editing.
Sites baseline version: 42. See the backup's RESTORE.md for exact identifiers.

## Official sources reviewed

- https://sygna.es/: invoicing, HR, accounting and company-data questions with Sara AI.
- https://tumesaya.centraldereservas.ai/: telephone reservations 24/7, availability, confirmations, reminders and cancellations. WhatsApp is explicitly upcoming and is not advertised here as available.
- https://siweb.es/: call-center platform presented as Aivooz, centralizing campaigns, contacts and statistics. Retained the owner's existing name “Call Center Siweb”.

## Assets used

- `public/assets/showcase/sygna-dashboard.webp`: https://sygna.es/assets/panelBg-DrGmM_wC.webp
- `public/assets/showcase/tumesaya-app.webp`: https://tumesaya.centraldereservas.ai/static/media/img-appmovil.2e5297150f2496d12374.webp
- `public/assets/showcase/tumesaya-restaurant.webp`: https://tumesaya.centraldereservas.ai/static/media/restaurant-service-busy-v2.c6b1f64796e315d41f19.webp
- Existing local Sygna and Siweb device mockups remain in use.

Unused downloaded assets were excluded: Sygna's assistant illustration still says Atlas while the current copy says Sara, its invoicing banner includes an unnecessary compliance badge, and Siweb's alternative image is darkened. The Figma file supplied contains Blue's social profile and cover artwork; no edits were needed there.

## Implementation

Product-only data in src/data/showcases.ts; the hero's existing images and animation are unchanged.
The initial redesign used two manually selected views per product. The subsequent carousel revision removes all tabs and includes 7 Sygna, 5 Tu Mesa Ya and 3 Siweb images (deduplicated original mockups plus selected official assets). Images move to the right every 4.5 seconds with an 850ms slide transition. Controls allow pausing, resuming, previous/next and keyboard navigation; touch swipes are supported. Autoplay pauses when offscreen, hovered or the document is hidden, and is disabled for reduced motion. Manual navigation stops rotation until resumed. Gentle CSS lighting runs only while visible. No invented metrics or simulated live activity.

Additional official Sygna assets for the carousel:

- `sygna-documents.webp`: https://sygna.es/assets/Ticket-CG-hdwLY.webp
- `sygna-chat.webp`: https://sygna.es/assets/Chat-C3Ls2EJR.webp

Pre-carousel source backup: `.design-backups/before-product-carousel-20260917/` (Sites version 43).

Carousel validation: Astro check/build passes without errors or warnings. Browser checks exercised all 15 images, including last-to-first wrap, verified pause and manual navigation, and observed automatic advancement. At 390px the stages retain a stable height with no horizontal overflow. No browser console errors.

Carousel publication: Sites version 44, commit `82e538c6fab6e139ad54ee09e92f7867154a7ea1`, saved version `appgprj_6aaa88807ef08191a9fef2a2e0698afd~appgver_a1821d2dd11c819197792304f7536392`.

## Validation and publication

- Astro check/build: 24 files, zero errors and warnings.
- Browser: desktop and 390px mobile review, all six images loaded; no horizontal overflow; tab selection and arrow-key navigation verified; no console errors.
- Only Project.astro and three new showcase source files differ from the source backup.
- Sites version 43; commit `a0dc965955ba340c2995ab60ddc204aac99a96c5`.
- Version ID: `appgprj_6aaa88807ef08191a9fef2a2e0698afd~appgver_569f8cae60f08191ad8e9510c264c0ab`.

## Image cleanup and simplified controls — current revision

Removed pause/play controls; only previous/next arrows remain. Manual navigation no longer pauses autoplay. Rotation continues while the carousel is visible, including while hovered or focused; hidden-document and reduced-motion safeguards remain.

Excluded washed-out Sygna dashboard, documents and chat assets. Replaced the yellow Tu Mesa Ya composition with the existing clear device mockup. Current selection: 4 Sygna, 4 Tu Mesa Ya, 3 Siweb images. Original files remain available for restoration.

Presentation uses each image's native aspect ratio in a neutral full-width frame, with no extra glow, perspective or blended background. Captions sit in a separate white strip.

Validation: Astro check/build (26 files) passed without diagnostics. Desktop (1280px) and mobile (390px) visual checks passed, no horizontal overflow, two arrow controls per carousel, manual navigation and subsequent automatic advancement observed, no console errors.

Backup: `.design-backups/before-clean-carousels-20260917/src`; public baseline version 45, commit `cd05cc3dbbe1f8f41ee02cd3592598b5c9a0cf10`.

Cleanup published successfully as Sites version 46, commit `2b0250597823e2017ab7ecd817c0c8058f86c8fc`; saved version `appgprj_6aaa88807ef08191a9fef2a2e0698afd~appgver_ff44d2cdb3588191906baa1878a55154`.
