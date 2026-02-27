# Migration plan: product monolith with reusable modules

## Context and current state

- Repo: NestJS backend with modules under `src/services/*-ms` (access, admin, email, identity, organization, taxes).
- Shared layer in `src/shared` (database config, event-bus).
- App wiring in `src/app.module.ts` with Identity + Taxes modules.
- Root contains various artifacts (XML/ZIP) and a sensitive-looking file (`MiClavePrivada`) that should be moved out of the repo or added to `.gitignore`.

## Target outcome

- Single deploy, single DB.
- Modular monolith with clear boundaries and reusable modules.
- Internal event-bus used only for async flows (email, notifications, taxes).

## Decisions

- Architecture style: product monolith with reusable modules (not a template/framework).
- Communication style: internal direct calls by default; event-bus only for async tasks.

## Target layout

```
src/
  modules/
    <domain>/
      domain/
      application/
      infrastructure/
      interfaces/
  shared/
    database/
    event-bus/
    utils/
```

## Migration phases

1. Alignment and objectives
   - Confirm success criteria: fewer cross-module dependencies, clean repo root, stable tests.

2. Layout standardization
   - Introduce `src/modules/<domain>` structure.
   - Define allowed dependencies between modules and `shared`.

3. Domain-by-domain refactor (iterative)
   - Move `src/services/*-ms` into `src/modules/*`.
   - Replace microservice-style boundaries with internal APIs.
   - Export explicit public APIs from each module.

4. Infrastructure consolidation
   - Centralize config (typed schema) and logging.
   - Keep event-bus for async tasks only.

5. Data and ORM consolidation
   - Consolidate entities and repositories under each module.
   - Normalize migrations.

6. Repo cleanup
   - Move XML/ZIP artifacts to `docs/` or `test/fixtures/`.
   - Remove or relocate sensitive files from the repo.

7. Quality gates
   - ESLint boundary rules.
   - Tests per module + integration test coverage.
   - Architecture doc with dependency rules.

## Recommended migration order (low risk)

1. taxes
2. email
3. access
4. identity
5. organization
6. admin

## Definition of done per module

- New layout applied.
- Public API documented.
- Tests green.
- No forbidden cross-module imports.

## Notes

- Keep existing behavior stable while moving boundaries.
- Favor incremental PRs per module.
