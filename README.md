# Majlis UI

React + TypeScript components built from the Majlis Figma file
([UOnIj7Luxt9xV4wu06lNFy](https://www.figma.com/design/UOnIj7Luxt9xV4wu06lNFy/Majlis)).

## What's here

| Path | Contents |
| --- | --- |
| `src/tokens/` | Design tokens generated from the Figma variable collections (Primitives, Semantic - Color, Semantic), using the variables' code-syntax names |
| `src/components/Button/` | Button — Variant=Primary, Size=Small / Medium / Large, State=Default / Hover / Focus / Pressed / Disabled / Loading (Figma `481:10750`) |
| `src/components/TabBar/` | Tab Bar — Style=Icon Tabs (Figma `580:1841`) |
| `src/components/FileUpload/` | File Upload / Dropzone — Idle, Drag over, Uploading, Uploaded, Error (Figma `330:10272`) |
| `src/components/Sidebar/` | Sidebar — Glass style, Expanded and Collapsed, with Default / Hover / Active items (Figma `1501:4459`) |
| `.storybook/`, `src/**/*.stories.tsx` | Storybook (React + Vite). `preview.ts` loads the same tokens as the app; the Button has Playground, Sizes, States and other stories |
| `src/App.tsx` | Demo page: Primary Button (all states × sizes + a working one), Tab Bar, Sidebar (both modes + a working one), all Dropzone variants, and a working upload demo |
| `tests/visual-verify.mjs`, `tests/verify-sidebar.mjs`, `tests/verify-button.mjs` | Render the build in Chromium and check element geometry and colours against values read from Figma |

Icons are the SVGs exported from Figma; they are rendered as CSS masks so their colour comes from the tokens.

## Scripts

```sh
npm install
npm run dev            # demo page
npm test               # unit / behaviour tests (Vitest + Testing Library)
npm run build
npm run storybook      # Storybook on http://localhost:6006
npm run build-storybook  # static Storybook in storybook-static/
npm run verify:visual  # Figma-vs-browser check (needs a Chromium; path set in the script)
```

## Live demo

Every push to `main` builds and deploys the demo page and Storybook to GitHub Pages
(workflow: `.github/workflows/deploy-pages.yml`):

- Demo: **https://gopikaashok-ux.github.io/majlis/**
- Storybook: **https://gopikaashok-ux.github.io/majlis/storybook/**
