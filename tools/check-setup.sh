#!/usr/bin/env bash
# check-setup.sh: checks that your workbench is ready for the course.
#
# Usage:
#   bash tools/check-setup.sh           # all setup checks
#   bash tools/check-setup.sh --usage   # only your key's spend: limit, used, remaining
#
# This script never prints your API key or any part of it.
# It reads the key from the environment variable OPENROUTER_API_KEY
# (set as a Codespaces secret) and sends it only to openrouter.ai.

set -uo pipefail

API_URL="https://openrouter.ai/api/v1/key"
EXPECTED_OPENCODE="1.18.35"
SETUP_URL="https://www.gen-ai.startupengineer.io/sessions/02_agent_workbench/setup.html"

ok()   { printf '  \033[32m[ok]\033[0m   %s\n' "$1"; }
warn() { printf '  \033[33m[warn]\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m[fail]\033[0m %s\n' "$1"; FAILED=$((FAILED + 1)); }
info() { printf '  \033[36m[info]\033[0m %s\n' "$1"; }
FAILED=0

# Calls GET /api/v1/key with the key in a header that is passed via stdin,
# so the key never appears in the process list or in any output.
# Writes the response body to the file given as $1 and prints the HTTP status.
fetch_key_info() {
  local body_file="$1"
  printf 'Authorization: Bearer %s\n' "$OPENROUTER_API_KEY" |
    curl --silent --show-error --max-time 15 \
      --header @- \
      --output "$body_file" \
      --write-out '%{http_code}' \
      "$API_URL" 2>/dev/null || printf '000'
}

# Prints limit / usage / remaining from the JSON body. Only these numeric
# fields are read; the response's "label" field contains a masked form of the
# key and is deliberately never printed.
print_usage() {
  local body_file="$1"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).data || {};
      const f = (x) => (x === null || x === undefined) ? "no limit" : "$" + Number(x).toFixed(2);
      console.log("  Spending limit : " + f(d.limit));
      console.log("  Used so far    : " + f(d.usage) + "   (today: " + f(d.usage_daily) + ")");
      console.log("  Remaining      : " + f(d.limit_remaining));
    ' "$body_file"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -I -c '
import json, sys
d = json.load(open(sys.argv[1])).get("data", {})
f = lambda x: "no limit" if x is None else "$%.2f" % x
print("  Spending limit : " + f(d.get("limit")))
print("  Used so far    : " + f(d.get("usage")) + "   (today: " + f(d.get("usage_daily")) + ")")
print("  Remaining      : " + f(d.get("limit_remaining")))
' "$body_file"
  else
    warn "Neither node nor python3 found; cannot read the usage numbers."
  fi
}

explain_status() {
  case "$1" in
    200) ok "OpenRouter accepted your key" ;;
    401) fail "OpenRouter says the key is invalid (401). Check for a typo in the secret, or ask the instructor." ;;
    402) fail "Your key has no credit left (402). Request a top-up (see setup page)." ;;
    403) fail "OpenRouter refused the key (403). It may be disabled or expired. Ask the instructor." ;;
    429) warn "OpenRouter is rate-limiting right now (429). Wait a minute and try again." ;;
    000) fail "Could not reach openrouter.ai. Check the internet connection of your Codespace." ;;
    *)   fail "Unexpected answer from OpenRouter (HTTP $1). Try again; if it persists, ask the instructor." ;;
  esac
}

key_present() {
  [ -n "${OPENROUTER_API_KEY:-}" ]
}

# ---- usage mode -------------------------------------------------------------
if [ "${1:-}" = "--usage" ]; then
  if ! key_present; then
    echo "OPENROUTER_API_KEY is not set. See $SETUP_URL"
    exit 1
  fi
  tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
  status="$(fetch_key_info "$tmp")"
  if [ "$status" = "200" ]; then
    echo "Your course key ($(date -u '+%Y-%m-%d %H:%M UTC')):"
    print_usage "$tmp"
    exit 0
  fi
  explain_status "$status"
  exit 1
fi

if [ $# -gt 0 ]; then
  echo "Usage: bash tools/check-setup.sh [--usage]"
  exit 2
fi

# ---- full check -------------------------------------------------------------
echo "Checking your workbench ..."
echo

echo "1. Repository"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "You are inside a git repository: $(basename "$(git rev-parse --show-toplevel)")"
  if [ -n "$(git remote get-url origin 2>/dev/null)" ]; then
    ok "It is connected to GitHub (remote 'origin')"
  else
    warn "No remote 'origin'. Did you create the repository from the template on GitHub?"
  fi
else
  fail "This folder is not a git repository. Open the terminal in your workbench repository."
fi
info "Did you add christophihl as collaborator? (Settings → Collaborators) This script cannot check it."

echo "2. Git identity"
if [ -n "$(git config user.name)" ] && [ -n "$(git config user.email)" ]; then
  ok "git user is set: $(git config user.name)"
else
  fail "git user.name / user.email missing. Run: git config --global user.name \"Your Name\" and git config --global user.email \"you@example.com\""
fi

echo "3. Environment"
if [ "${CODESPACES:-}" = "true" ]; then
  ok "Running in a GitHub Codespace"
else
  warn "Not running in a Codespace. This works, but the course supports Codespaces only."
fi
for tool in node npm curl; do
  if command -v "$tool" >/dev/null 2>&1; then ok "$tool found"; else fail "$tool missing. Rebuild the Codespace or run: bash .devcontainer/post-create.sh"; fi
done

echo "4. Coding agent"
if command -v opencode >/dev/null 2>&1; then
  v="$(opencode --version 2>/dev/null | tail -n 1)"
  if [ "$v" = "$EXPECTED_OPENCODE" ]; then
    ok "opencode $v installed"
  else
    warn "opencode $v installed, course version is $EXPECTED_OPENCODE"
  fi
else
  fail "opencode not found. Run: bash .devcontainer/post-create.sh"
fi
if [ -f opencode.json ]; then ok "opencode.json found (default model and permissions)"; else warn "opencode.json missing in this folder. Run this script from the repository root."; fi
DEFAULT_MODEL="openrouter/anthropic/claude-haiku-5.5"
if command -v opencode >/dev/null 2>&1; then
  if opencode models openrouter 2>/dev/null | grep -qx "$DEFAULT_MODEL"; then
    ok "Default model known to opencode: $DEFAULT_MODEL"
  else
    warn "opencode does not know $DEFAULT_MODEL yet. Run: opencode models --refresh"
  fi
fi
if [ -f AGENTS.md ]; then ok "AGENTS.md found (standing instructions for the agent)"; else warn "AGENTS.md missing."; fi

echo "5. Course key"
if key_present; then
  ok "OPENROUTER_API_KEY is set"
  case "$OPENROUTER_API_KEY" in
    sk-or-*) ok "The key has the expected format" ;;
    *) warn "The key does not start like an OpenRouter key. Check that you pasted the whole key into the secret." ;;
  esac
  tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
  status="$(fetch_key_info "$tmp")"
  explain_status "$status"
  [ "$status" = "200" ] && print_usage "$tmp"
else
  fail "OPENROUTER_API_KEY is not set. Add it as a Codespaces secret, then stop and restart the Codespace."
fi

echo "6. Secrets hygiene"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  key_pattern='sk-or-v1-[A-Za-z0-9]{20,}'
  revs=()
  while IFS= read -r rev; do revs+=("$rev"); done < <(git rev-list --all 2>/dev/null)
  found=0
  # working tree (incl. untracked files), then every commit in the history
  git grep -I -q -E --untracked "$key_pattern" 2>/dev/null && found=1
  if [ "${#revs[@]}" -gt 0 ] && git grep -I -q -E "$key_pattern" "${revs[@]}" -- 2>/dev/null; then found=1; fi
  if [ "$found" -eq 1 ]; then
    fail "Something that looks like an OpenRouter key is in your files or git history. Find it with: git grep -n sk-or-v1- ; if it was ever committed, tell the instructor now (the key must be revoked)."
  else
    ok "No OpenRouter key found in your files or git history"
  fi
fi

echo
if [ "$FAILED" -eq 0 ]; then
  echo "All checks passed. Start the agent with:  opencode"
else
  echo "$FAILED check(s) failed. Fix them using the hints above or the setup page:"
  echo "  $SETUP_URL"
  exit 1
fi
