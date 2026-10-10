#!/usr/bin/env bash
# Runs once when the Codespace is created. Installs the coding agent at a
# pinned version so that every student has the same tool all semester.
# The instructor bumps the version deliberately (once per course part).
set -euo pipefail

OPENCODE_VERSION="1.18.35"

echo "Installing OpenCode ${OPENCODE_VERSION} ..."
npm install --global --no-audit --no-fund "opencode-ai@${OPENCODE_VERSION}"

# The pinned release ships a model catalogue snapshot; refresh it from
# models.dev so that newer models (e.g. the course default) are known.
opencode models --refresh >/dev/null 2>&1 || echo "Note: could not refresh the model list (run: opencode models --refresh)"

# Sensible git defaults for beginners
git config --global pull.rebase false
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

chmod +x tools/*.sh 2>/dev/null || true

echo
echo "Setup finished. Next step: run   bash tools/check-setup.sh"
