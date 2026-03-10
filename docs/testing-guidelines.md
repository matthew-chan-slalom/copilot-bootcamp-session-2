# Testing Guidelines

This document defines the testing requirements for the project.

## Unit Tests

- Use Jest to test individual functions and React components in isolation.
- Unit tests must use the naming convention `*.test.js` or `*.test.ts`.
- Backend unit tests must be placed in `packages/backend/__tests__/`.
- Frontend unit tests must be placed in `packages/frontend/src/__tests__/`.
- Name unit test files to match what they are testing (for example, `app.test.js` for `app.js`).

## Integration Tests

- Use Jest + Supertest to test backend API endpoints with real HTTP requests.
- Integration tests must be placed in `packages/backend/__tests__/integration/`.
- Integration tests must use the naming convention `*.test.js` or `*.test.ts`.
- Name integration test files based on the behavior or API area being tested (for example, `todos-api.test.js` for TODO API endpoints).

## End-to-End (E2E) Tests

- Use Playwright (required framework) to test complete UI workflows through browser automation.
- E2E tests must be placed in `tests/e2e/`.
- E2E tests must use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey being tested (for example, `todo-workflow.spec.js`).
- Playwright tests must use one browser only.
- Playwright tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E tests to 5-8 critical user journeys, focusing on happy paths and key edge cases rather than exhaustive coverage.

## Port Configuration

- Always use environment variables with sensible defaults for port configuration.
- Backend port configuration must follow this pattern:

```js
const PORT = process.env.PORT || 3030;
```

- Frontend uses React's default port `3000`, and it may be overridden with the `PORT` environment variable.
- This configuration supports CI/CD workflows that dynamically detect and assign ports.

## Test Quality and Maintainability Requirements

- All tests must be isolated and independent.
- Each test must set up its own data and must not rely on other tests.
- Setup and teardown hooks are required so tests succeed consistently across multiple runs.
- All new features must include appropriate tests.
- Tests must be maintainable and follow best practices.
