#!/usr/bin/env bash
# get-assignment.sh: downloads the starter folder of an assignment from the
# public course template into your repository.
#
# Usage:
#   bash tools/get-assignment.sh a03
#
# Why this script exists: your repository was created from a template, so it
# shares no history with the template and cannot "git pull" new assignments.
# This script copies only the new folder (e.g. a03/) and never overwrites
# anything you already have.

set -euo pipefail

TEMPLATE_REPO="${GENAI_TEMPLATE_REPO:-TUHHStartupEngineers-Classroom/gen-ai-workbench}"
TEMPLATE_BRANCH="${GENAI_TEMPLATE_BRANCH:-main}"

usage() {
  echo "Usage: bash tools/get-assignment.sh aNN    (for example: a03)"
  exit 2
}

[ $# -eq 1 ] || usage
folder="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
[[ "$folder" =~ ^a[0-9]{2}$ ]] || usage

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Run this inside your workbench repository."
  exit 1
}
target="$repo_root/$folder"

if [ -e "$target" ]; then
  echo "The folder $folder/ already exists. Nothing was changed."
  echo "If you really want a fresh copy, rename your folder first (e.g. mv $folder ${folder}_old)."
  exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

url="https://codeload.github.com/${TEMPLATE_REPO}/tar.gz/refs/heads/${TEMPLATE_BRANCH}"
echo "Downloading $folder/ from github.com/${TEMPLATE_REPO} ..."
if ! curl --fail --silent --show-error --location --max-time 60 "$url" --output "$tmp/template.tar.gz"; then
  echo "Download failed. Check your internet connection and try again."
  exit 1
fi

mkdir "$tmp/x"
tar -xzf "$tmp/template.tar.gz" -C "$tmp/x"

# The archive contains a single top-level folder (<repo>-<branch>/)
src="$(find "$tmp/x" -mindepth 2 -maxdepth 2 -type d -name "$folder" | head -n 1)"
if [ -z "$src" ]; then
  echo "The template has no folder $folder/ yet. The instructor publishes it with the session."
  exit 1
fi

cp -R "$src" "$target"
echo "Done. New folder: $folder/"
echo "Files:"
(cd "$repo_root" && find "$folder" -type f | sort | sed 's/^/  /')
echo
echo "Next: read $folder/README.md, then commit the starter files:"
echo "  git add $folder && git commit -m \"Add $folder starter files\""
