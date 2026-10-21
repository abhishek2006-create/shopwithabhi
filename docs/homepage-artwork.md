# Homepage artwork

Created with the built-in image generation tool on 21 October 2026. These assets are illustrative, unbranded artwork, not photographs of tested or reviewed products. The attached website image was a layout reference; its product names, ratings, counts and claims were not imported as content.

## Hero

Saved asset: `public/editorial/shopping-hero.png` (2060 × 763).

Prompt:

> Create an original premium shopping editorial WEBSITE HERO BACKGROUND photograph, very wide panoramic 2.7:1 composition. Photorealistic warm ivory home office, light oak tabletop, soft morning window light and subtle shadows, a slim unbranded graphite laptop open showing an abstract black and burnt-orange flowing wallpaper, large premium black over-ear headphones resting on the desk on the far right, small green potted plant behind laptop, off-white wireless mouse in foreground, closed neutral notebook. Position ALL products predominantly in the RIGHT HALF, laptop centered around 72% of image width, headphone at 91%. LEFT HALF is very light soft ivory #FFFDF8 mostly empty unfocused wall and table with NO objects and ample clean negative space for HTML title and search form overlay. Camera view at desk height, polished realistic materials, restrained elegant commercial product photography, premium warm natural light, no people, no branding, NO TEXT, no letters, no badges, no logos, no website interface. Deliver the photograph only, not a webpage mockup.

## Category artwork

Saved asset: `public/editorial/category-artwork.png` (2172 × 724). The UI uses six viewports of the same optimized Next.js image. It is generic category artwork; owner-configured category images take precedence.

Prompt:

> An original premium product-category illustration asset for a shopping website: ONE very wide horizontal strip, aspect ratio exactly 6:1, six equally sized square panels arranged left to right, no visible borders or dividers, each panel on identical pure white background #FFFFFF. Every panel contains ONE unbranded photorealistic object centered precisely in its own square with equal generous whitespace above and below, consistent soft studio lighting and subtle natural grounding shadow, camera at slight front three-quarter angle. Six objects left to right in this exact order: 1 black over-ear headphones, 2 slim dark-gray open laptop with a simple unbranded dark orange abstract wallpaper, 3 white wireless earbuds with open charging case, 4 matte black cooking pot with lid, 5 dark smartwatch with blank neutral watchface and black strap, 6 closed ivory notebook with tan pen. Objects never cross their panel boundaries. Objects occupy only the central 65 percent of each square. This is generic illustrative category artwork, no logos, no brands, no words, no numbers, no price tags, no text at all. Premium clean commercial product photography.

The generated strip has a 3:1 canvas; the category viewports account for its actual dimensions. Neither image is used as a reviewed product's photograph. Replace artwork paths in `src/components/shopping-hero.tsx` and `src/app/page.tsx` when adding your own photography.
