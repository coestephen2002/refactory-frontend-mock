# Refactory frontend — offline development

Vue 3 + Vite frontend for a League of Legends statistics tracker. No Rails, database, Riot key, or additional mock dependencies are needed in mock mode.

## Run on Ubuntu 24.04 / Node.js 22

Use Node.js **22.12 or newer** (required by Vite 7).

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Mock mode is enabled by default; no environment file is required. You can optionally copy `.env.example` to `.env.local` (`cp` on Ubuntu, `copy` in Windows Command Prompt) to customize settings. Dependencies must be installed while connected, or available in your npm cache, before working offline. After installation, development and builds need no network.

Try searching **Ginjyyy** or **Ginjyyy#WHITE** with NA selected, or open `/summoners/na1/ginjyyy-white` directly. Expand matches and follow participant names to their profiles. All ten participants have local profiles. EUW has `Moonlight#EUW` with empty match history; KR has `Practice Mode#KR1` with empty ranks, mastery, and matches. Unknown players show a not-found message. Champions and skins pages use the sample champion roster; the skins viewer uses the existing bundled GLB model.

```sh
npm test
npm run build
npm run preview
```

Vite embeds environment flags at startup/build time. Restart the dev server after changing them; rebuild to change a production bundle. For a single Ubuntu command, use `VITE_USE_MOCK_API=true npm run dev` (or `npm run build`). Production hosting needs an SPA history fallback to `index.html` for direct profile URLs; Vite dev/preview handle this locally.

## Switch to Rails

Set `VITE_USE_MOCK_API=false` and set `VITE_API_URL=http://localhost:3000` in `.env.local`. Only the exact value `false` disables mock mode; an unset flag uses mocks. Restart/rebuild and run the backend with its usual credentials/CORS configuration. Real mode keeps Axios cookies and bearer authentication and uses the original Riot CDN resources. Mock tokens use a separate localStorage key so they do not overwrite real tokens.

## Architecture and fixtures

- `src/api.js` is the shared Axios client used by all Pinia stores and `$api`. Mock mode installs an Axios adapter; real mode keeps the original transport. Unknown mock requests reject with an Axios-style 404 and never fall through to HTTP.
- `src/mocks/adapter.js` handles summoner search/show/ranks/matches/masteries, champion list/detail/search, and account signup/login/view/logout. It preserves the `{ response: ... }` envelopes and snake_case fields consumed by the existing frontend. These contracts are inferred from the stores/components; Rails serializers are not included here.
- `src/mocks/fixtures.json` contains fictional, reproducible player stats, ten champions, and twelve full matches with ten participants each, mixed results, roles, damage, gold, CS, and vision. Search is case-insensitive and region-aware; match `count` limits results. Responses are cloned to prevent UI mutations from altering fixtures.
- `src/imageUrls.js` replaces CDN images with a bundled demo placeholder in mock mode. Champion ability text is a local sample, not complete Riot documentation. No CDN calls are needed in mock mode.
- Mock account actions accept any nonempty username/password and retain the account only for the current page session. They do not implement authentication or persist passwords. Reloading resets mock account state.

The roster is intentionally limited; this is not a Riot API emulator. Champion action buttons that were placeholders remain placeholders, and the skins page retains its existing single-model behavior. Add fixture entries or adapter handlers to extend coverage. `npm test` uses Node's built-in runner to check contracts, linked players, empty/error states, count limits, response isolation, champions, and demo accounts.
