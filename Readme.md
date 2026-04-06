# Felix Mono

`felix-mono` is the new monorepo baseline under `parrot-mate`.

Current status:

- repository ownership has been separated from the old `pmate-mono` baseline
- foundation stage is complete
- `apps/blueprint-web` now runs the migrated `blueprint-web`
- future migrations will move `blueprint-web` and `blueprint-api` after the baseline is verified

Current goal:

- keep the monorepo skeleton
- remove owner-specific deploy bindings from the previous baseline
- prepare a clean base for the first app migration

Next step:

- verify migrated `apps/blueprint-web` build, test, and local run
- migrate `mono-apps/apps/blueprint-api`
- prepare the first deploy path after web and api are both stable
