# Thin convenience wrappers around the pnpm scripts in package.json.
# Run `make` or `make help` to list targets.

.DEFAULT_GOAL := help
.PHONY: help install dev build preview open typecheck lint format test coverage e2e mutation knip audit check ci clean deploy

OUT := dist/crossword.html

help: ## List available targets
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  \033[1mmake %-10s\033[0m %s\n", $$1, $$2}'

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

install: node_modules ## Install dependencies (and the Playwright browser)
	pnpm exec playwright install chromium

dev: node_modules ## Start the Vite dev server with hot reload
	pnpm dev

build: node_modules ## Build the single-file app → dist/index.html + dist/crossword.html
	pnpm build

preview: build ## Serve the production build locally
	pnpm preview

open: build ## Build, then open the single file in your browser
	open $(OUT) 2>/dev/null || xdg-open $(OUT)

typecheck: node_modules ## Type-check all TypeScript
	pnpm typecheck

lint: node_modules ## ESLint (strict type-checked rules + DOM XSS checks)
	pnpm lint

format: node_modules ## Auto-format everything with Prettier
	pnpm format

test: node_modules ## Unit + DOM tests (Vitest)
	pnpm test

coverage: node_modules ## Tests with coverage report → coverage/index.html
	pnpm coverage

e2e: node_modules ## Playwright smoke test (desktop + phone) against the production build
	pnpm e2e

mutation: node_modules ## Stryker mutation testing of src/core → reports/mutation/index.html
	pnpm mutation

knip: node_modules ## Find unused files, exports, and dependencies
	pnpm knip

audit: node_modules ## Check dependencies for known vulnerabilities
	pnpm audit --audit-level high

check: node_modules ## Everything CI's check job runs: types, lint, format, knip, coverage, build
	pnpm check

ci: check e2e ## check + e2e (what must pass before deploy)

clean: ## Remove build output and reports
	rm -rf dist coverage reports .stryker-tmp playwright-report test-results

deploy: ## Push main; CI tests, builds, and publishes to GitHub Pages
	git push origin main
