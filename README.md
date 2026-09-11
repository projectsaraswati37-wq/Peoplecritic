# PeopleCritique AI

PeopleCritique is a playful, privacy-aware face and pose scanning experience. It uses MediaPipe in the browser for face landmarks and can use Google Gemini for visible presentation, pose, lighting, and styling analysis.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in a browser with camera access enabled.

## Gemini setup

Create `.env.local` from `.env.example` and add a newly rotated Gemini key:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

The key is read only by the Vite development-server middleware. It is never bundled into the browser app. When Gemini is missing or unavailable, the app falls back to its local demo generator.

Never commit `.env.local` or paste API keys into source files, chat, screenshots, or issue reports. Revoke any key that has been exposed.

## Product behavior

- Camera frames are analyzed locally for face landmarks and approximate head pose.
- Gemini receives the captured image only when configured, and the prompt limits analysis to visible presentation, pose, lighting, and styling.
- The app does not identify people or infer sensitive traits.
- Scan history is stored locally in the browser and is capped at 12 records.
- Results can be shared when the browser supports Web Share or downloaded as JSON.
- Speech synthesis and browser speech recognition are optional and have visible fallbacks.
- Malayalam voiceover uses the free Edge neural voice adapter (`ml-IN-SobhanaNeural`) through the local server route, with browser speech as fallback.

## Commands

```bash
npm run build
npm run lint
```

The `frontend-dev-bookmarks` repository is treated as a reference for frontend information architecture and discovery patterns, not as a runtime dependency.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
