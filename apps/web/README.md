# MindMitra Person Application

The person-facing MindMitra web app is a calm, accessible environment for a person's day, memories, meaningful activities, and help. It uses the governed FastAPI companion rather than fabricating memories or duplicating personal-data logic in the browser.

## Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Configure `NEXT_PUBLIC_API_URL` when the API is not on `http://localhost:8000`.

## Person-device session

The person does not enter a password. For the current development demo, the main page automatically exchanges the seeded `person:purnima` demo device credential through `POST /v1/auth/device-login`; it is accepted only after the development-only demo seed has run. The browser token is stored under `mindmitra.person.access-token`.

The app verifies that token with `GET /v1/auth/me` before it renders a person session. It calls only the existing governed endpoints:

- `POST /v1/persons/{person_id}/companion/turn`
- `GET /v1/persons/{person_id}/voice/capability`

The browser never submits an actor ID, role, consent status, or personal facts. With no valid device session, the app shows a neutral helper-setup state rather than a profile picker or hard-coded person.

## Verify

```bash
pnpm test
pnpm lint
pnpm build
```

Focused tests cover device-session state, authenticated request boundaries, stable person navigation, governed companion responses, and text fallback when voice is unavailable.
