# Majlis UI

React + TypeScript components built from the Majlis Figma file
([UOnIj7Luxt9xV4wu06lNFy](https://www.figma.com/design/UOnIj7Luxt9xV4wu06lNFy/Majlis)).

## What's here

| Path | Contents |
| --- | --- |
| `src/tokens/` | Design tokens generated from the Figma variable collections (Primitives, Semantic - Color, Semantic), using the variables' code-syntax names |
| `src/components/TabBar/` | Tab Bar — Style=Icon Tabs (Figma `580:1841`) |
| `src/components/FileUpload/` | File Upload / Dropzone — Idle, Drag over, Uploading, Uploaded, Error (Figma `330:10272`) |
| `src/App.tsx` | Demo page: Tab Bar, all Dropzone variants, and a working upload demo |
| `tests/visual-verify.mjs` | Renders the build in Chromium and checks element geometry and colours against values read from Figma |

Icons are the SVGs exported from Figma; they are rendered as CSS masks so their colour comes from the tokens.

## Scripts

```sh
npm install
npm run dev            # demo page
npm test               # unit / behaviour tests (Vitest + Testing Library)
npm run build
npm run verify:visual  # Figma-vs-browser check (needs a Chromium; path set in the script)
```
