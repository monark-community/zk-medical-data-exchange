# CURA - Shared Package (packages/shared)

Shared TypeScript models and utilities used across the frontend and backend. This package centralizes common types (study criteria, user profile), binning utilities for analytics, and exports them for consumption via workspace linking.

## Usage

Import types or helpers from `@zk-medical/shared` in the workspaces that depend on it (e.g., `apps/web`, `apps/api`).

```ts
import { StudyCriteria } from "@zk-medical/shared/studyCriteria";
import { generateBinsFromCriteria } from "@zk-medical/shared/binningAlgorithm";
```

### Exports

- `studyCriteria.ts` – StudyCriteria type and helpers
- `userProfile.ts` – User profile interface
- `dataBins.ts` – Bin definitions, enums, defaults, labels
- `binningAlgorithm.ts` – `generateBinsFromCriteria` for analytics binning

## Development

- Changes here are consumed via workspace resolution (`workspace:*`) in the monorepo.
- Keep exports stable to avoid breaking downstream apps. Update both web and api if shared types change.
