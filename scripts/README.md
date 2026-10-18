# Opening artwork

The profile's opening GIFs play once, then stop on the completed hero poster.
They are committed assets: viewing the profile does not require a build or an
external animation service. The existing SVGs remain the static and reduced-motion
versions. The desktop and mobile GIFs use the same dimensions as those SVGs.

To regenerate after editing the artwork or timing:

```sh
npm ci
npm run build:opening
```

The generator renders the existing SVG layers with resvg and encodes a shared
brand-color palette with transparent frame differences to reduce file size.
Motion runs at 25 fps for 4.4 seconds. There is no GIF loop extension.

Use `npm run build:opening -- --preview` to also export PNGs for eight points in
the sequence into `.opening-preview/`. Those files are local previews only.

Fonts follow the SVGs: Arial and Courier New, with Liberation Sans / Liberation
Mono fallbacks. Install those fonts before regenerating on Linux. A custom font
folder can be supplied with `HACKPACK_FONT_DIR=/path/to/fonts`. No font files are
embedded or redistributed. Font metrics can vary across systems, so inspect the
exported PNGs when rebuilding on a different platform.
