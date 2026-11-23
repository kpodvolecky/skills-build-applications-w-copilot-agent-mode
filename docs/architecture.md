# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React 19 routes for the four capabilities, one shared API client for URL construction and fetch behavior, and Bootstrap cards/lists for accessible presentation states.
- Logic tier decision: Keep Express routing thin and put validation and business behavior in typed service functions in `octofitService.ts`.
- Data tier decision: Define required Mongoose fields and relationships in the four model schemas, and seed stable demo records by upsert without clearing unrelated data.
- Activity tracking approach: Validate ObjectIds and references in the service, persist valid activities with computed `minutes`-based points and a creation timestamp, and return deliberate 4xx responses for invalid input.
- Team management approach: Require a name and mascot, default members to an empty array, validate submitted member IDs against existing users, and preserve `name`, `mascot`, and `members` in list/create responses.
- Leaderboard approach: Aggregate activity points by team ID, resolve team names from Mongoose teams, sort descending by total points, break ties alphabetically, and assign 1-based ranks.
- Workout suggestions approach: Match a seeded user by email, derive the preferred focus from the user's fitness goal or most recent activity, select a matching workout, and include an explanatory `reason`; return 404 for an unknown email.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Result: PASS - 5 tests. Failures indicate missing Mongoose validation or broken idempotent seed behavior.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Result: PASS - 4 tests. Failures indicate incorrect routes, input validation, leaderboard aggregation, or workout recommendation behavior.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Result: PASS - 15 tests. Failures indicate missing routes, shared API usage, or loading, empty, success, or accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Result: PASS - `tsc --noEmit` confirms the backend is type-safe.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Result: PASS - `tsc --noEmit` and the Vite production build both succeed.
