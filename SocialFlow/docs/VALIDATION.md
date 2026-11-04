# Validation — 29 October 2026

- Backend compile and executable JAR packaging: PASS.
- Spring HTTP integration tests: 5 passed, 0 failures/errors. Each test covers a sequence of workflows.
- Backend JaCoCo line coverage: **99.06% (210/212 lines)**. The 80% aggregate gate passed; application classes are not excluded.
- Frontend production build: PASS.
- Frontend Vitest tests: 4 passed.
- Compose YAML, Maven XML, npm lockfile and Python smoke-test syntax: checked.
- Full Docker/PostgreSQL/Kafka stack startup: NOT executed in the authoring environment; Docker is unavailable.
- Browser visual/click automation: NOT executed.
- Public deployment and live social platform integrations: NOT executed or configured.

See `backend-coverage/index.html` for the generated coverage report. The backend tests use H2 in PostgreSQL compatibility mode and a mocked Kafka transport. They verify HTTP authentication, RBAC, validation, post lifecycle, comments, analytics, notification isolation, durable queuing after failure and idempotent publishing. They do not establish actual broker or PostgreSQL interoperability.

To verify the actual container stack, run `docker compose up --build -d --wait` then `python scripts/smoke.py`. The GitHub Actions workflow runs these same Docker integration steps.

The frontend build emits an advisory about the main JavaScript chunk size (about 600 kB before gzip); it completes successfully. Frontend test coverage is limited to utility logic, not the whole React interface.
