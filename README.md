# Easing Lab

An interactive TypeScript playground for [`@bluehexagons/easing`](https://github.com/bluehexagons/easing). It makes the package's full curve registry, configurable constructors, and composition utilities easy to see and feel in a browser.

## What it showcases

- All 33 parameter-free curves from `@bluehexagons/easing/named`
- Live animation playback, scrubbing, timing, and curve plotting
- Constructors for springs, cubic Béziers, steps, elastic curves, and monotone splines
- Composition helpers including `compose`, `mix`, `clamp`, `reverse`, `repeat`, `alternate`, and `invert`
- Copyable TypeScript examples for every selection
- Search, curve-family filters, responsive layouts, and reduced-motion support

## Development

Use Node.js 24 or newer.

```sh
npm install
npm run dev
```

Run all local checks and create the production bundle with:

```sh
npm run check
```

The easing package's latest APIs are newer than its npm release, so this project pins an exact commit from its GitHub repository. The project-level `.npmrc` allows only root Git dependencies, as required by npm 12; transitive Git dependencies remain disabled.

## Deployment

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) checks every pull request and push to `main`. On `main`, it uploads the Vite production build and, when the repository is public, deploys it through GitHub Pages using current actions pinned by commit SHA.

Once the repository is public, select **GitHub Actions** as the Pages source under **Settings → Pages**. Vite uses relative asset paths, so the build works at the repository path (`/easing-sandbox/`) without environment-specific configuration.
