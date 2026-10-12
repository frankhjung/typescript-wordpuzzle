.DEFAULT_GOAL := default
.PHONY: help format lint check test build package clean dictionary run

SHELL := bash
.SHELLFLAGS := -euo pipefail -c
MAKEFLAGS += --warn-undefined-variables
.DELETE_ON_ERROR:

help: ## Display available targets and descriptions
	@awk 'BEGIN {FS = ":.*?## "}; \
		/^[a-zA-Z_-]+:.*?## / \
		{printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)
	npx tsx src/cli.ts --help

default: format lint build test	## Default: format, lint, build and test

format: ## Format all tracked source and config files using Prettier
	npx prettier --write .

lint: ## Run ESLint static analysis
	npx eslint .

check: ## Verify types without emitting compiled output
	npx tsc --noEmit

test: ## Execute unit and fast-check property tests
	npx vitest run

build: check ## Compile TypeScript to JavaScript distribution
	npx tsc -p tsconfig.build.json

package: build ## Package dist/ build artefacts into wordpuzzle tarball
	npm pack

clean: ## Remove build outputs and temporary artefacts
	rm -rf dist coverage *.tgz

dictionary: ## Extract 4+ letter words from /usr/share/dict/words
ifeq (,$(wildcard /usr/share/dict/words))
	@echo "Warning: /usr/share/dict/words not found, skipping"
else
	@echo "Filtering 4+ letter words from system dictionary..."
	@LC_ALL=C grep -E '^[a-z]{4,}$$' /usr/share/dict/words \
	  | grep -Ev '^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$$' \
	  | sort -u > dictionary
	@echo "Dictionary created: $$(wc -l < dictionary) words"
endif

run: ## Run solver with sample input
	npx tsx src/cli.ts -s 7 -l cadevrsoi
