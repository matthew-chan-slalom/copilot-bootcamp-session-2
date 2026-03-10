# Coding Guidelines

This document defines coding standards for the project to keep the codebase clean, consistent, and maintainable.

## Core Principles

- Prioritize readability over cleverness.
- Keep functions and components focused on a single responsibility.
- Follow the DRY principle (Don't Repeat Yourself):
  - Extract repeated logic into reusable functions, hooks, utilities, or shared modules.
  - Reuse constants for repeated strings, URLs, and configuration values.
  - Avoid copy-paste implementations across frontend and backend.
- Prefer composition over deeply nested conditionals.
- Make code changes small, incremental, and easy to review.

## Linting Requirements

- Use ESLint to enforce consistent code style and catch common errors early.
- Address lint warnings and errors before merging changes.
- Frontend linting follows the `react-app` and `react-app/jest` ESLint configuration from `packages/frontend/package.json`.
- Backend code should also be linted with ESLint rules compatible with Node.js and Jest.
- Recommended script conventions for workspaces:
  - `lint`: run ESLint for the workspace
  - `lint:fix`: run ESLint with automatic fixes
- Treat linting as part of normal development and CI validation.

## JavaScript and React Best Practices

- Use descriptive names for variables, functions, files, and components.
- Prefer `const` by default; use `let` only when reassignment is required.
- Keep functions small and avoid deeply nested logic.
- Handle errors explicitly with clear messages and appropriate status codes.
- For React:
  - Keep components focused and reusable.
  - Move non-UI logic into hooks or utilities where appropriate.
  - Avoid unnecessary state; derive values when possible.

## Project Structure and Reuse

- Keep backend concerns in `packages/backend` and frontend concerns in `packages/frontend`.
- Place shared business rules in reusable modules instead of duplicating logic in routes or components.
- Co-locate tests with the structure defined in `docs/testing-guidelines.md`.
- Prefer clear module boundaries over cross-layer shortcuts.

## Testing and Code Quality

- All new features and bug fixes must include appropriate tests.
- Write tests that verify behavior, not implementation details.
- Keep tests deterministic and independent.
- Refactor safely:
  - Add or update tests before major refactors.
  - Confirm behavior remains unchanged after refactoring duplicated logic.

## Documentation and Comments

- Document non-obvious decisions in pull requests and relevant docs.
- Use comments sparingly and only for intent, constraints, or edge-case rationale.
- Remove stale comments and dead code during changes.

## Code Review Expectations

- Code reviews should verify:
  - Correctness and requirement coverage
  - Readability and maintainability
  - DRY compliance and reuse opportunities
  - Lint/test readiness
- Prefer actionable feedback with concrete examples.
