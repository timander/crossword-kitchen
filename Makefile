# Thin convenience wrappers around the pnpm scripts in package.json.
# Run `make` or `make help` to list targets.

.DEFAULT_GOAL := help
.PHONY: help install build dev test typecheck check open clean deploy

OUT := dist/crossword.html

help: ## List available targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  \033[1mmake %-10s\033[0m %s\n", $$1, $$2}'

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

install: node_modules ## Install dependencies

build: node_modules ## Build the single-file app → dist/crossword.html
	pnpm build

dev: node_modules ## Rebuild automatically on file changes
	pnpm dev

test: node_modules ## Run the generator and word bank tests
	pnpm test

typecheck: node_modules ## Type-check all TypeScript
	pnpm typecheck

check: typecheck test build ## Typecheck, test, and build (what CI runs)

open: build ## Build, then open the app in your browser
	open $(OUT) 2>/dev/null || xdg-open $(OUT)

clean: ## Remove build output
	rm -rf dist

deploy: ## Push main; GitHub Actions rebuilds and publishes to GitHub Pages
	git push origin main
