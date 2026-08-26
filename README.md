# Easing Lab

[![Test and deploy Pages](https://github.com/bluehexagons/easing-sandbox/actions/workflows/pages.yml/badge.svg)](https://github.com/bluehexagons/easing-sandbox/actions/workflows/pages.yml)

A TypeScript browser interface for [`@bluehexagons/easing`](https://github.com/bluehexagons/easing), including its named curves, constructors, and composition utilities.

**[Open Easing Lab](https://bluehexagons.github.io/easing-sandbox/)**

## Features

- All 33 parameter-free curves from `@bluehexagons/easing/named`
- Synchronized multi-curve playback and opt-in viewport autoplay that follows previews as you scroll
- Loop, rewind, same-easing alternate, once, and custom timeline repeat styles
- Custom timeline recipes for an active curve or composition, sine wobble, rigid steps, and bouncing return motion
- A shared duration range from 300 milliseconds to 30 seconds
- Switchable curve, movement, scale, rotation, and color visualizations across presets, recipes, and composition tools
- A persistent active-curve player with mobile preview plus compact and expanded modes
- Live scrubbing, curve plotting, output values, copyable TypeScript, and an editable function sandbox
- A live advanced-constructor workbench for springs, elastic responses, cubic Béziers, Hermite slopes, monotone splines, steps, and weighted blends
- Composition helpers including `compose`, `mix`, `clamp`, `reverse`, `repeat`, `alternate`, and `invert`, with one-click application to the active curve
- Copyable TypeScript examples for every selection
- Search, curve-family filters, responsive layouts, and reduced-motion support

## Development

Use Node.js 24 or newer.

```sh
npm install
npm run dev
```

To make the development server reachable from other devices on your local
network, use:

```sh
npm run host
```

This changes Vite's bind address; the VM firewall or an infrastructure gateway
must still permit access to the printed port.

Run all local checks and create the production bundle with:

```sh
npm run check
```

The easing package's latest APIs are newer than its npm release, so this project pins an exact commit from its GitHub repository. The project-level `.npmrc` allows only root Git dependencies, as required by npm 12; transitive Git dependencies remain disabled.

## Deployment

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) checks every pull request and push to `main`. On `main`, it uploads the Vite production build and deploys it through GitHub Pages using actions pinned by commit SHA.

The public deployment is available at
[bluehexagons.github.io/easing-sandbox](https://bluehexagons.github.io/easing-sandbox/).
GitHub Pages is configured to use **GitHub Actions** as its source. Vite uses
relative asset paths, so the production bundle works at the repository path
(`/easing-sandbox/`) without environment-specific configuration.
