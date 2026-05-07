#!/usr/bin/env bash
set -euo pipefail

# Simple script to commit local changes and push current HEAD to
# branch 'main' of GitHub repo 'ivaneckyjano-ops/naklady'.
# Modeled after common git-upload patterns.

# Usage:
#   ./git-upload-naklady.sh "Commit message"
# Environment overrides:
#   GIT_REMOTE_URL - if set, script pushes to this URL instead of default
#   GIT_BRANCH - target branch (default: main)

: ${GIT_REMOTE_URL:="git@github.com:ivaneckyjano-ops/naklady.git"}
: ${GIT_BRANCH:="main"}

# Parse options: --preview and --path (or use env var TARGET_PATH)
PREVIEW=false
FLAG_PATH=""

# Consume leading flags: --preview and --path
while [ $# -gt 0 ]; do
  case "$1" in
    --preview)
      PREVIEW=true
      shift
      ;;
    --path)
      if [ -z "${2:-}" ]; then
        echo "Error: --path requires an argument" >&2
        exit 1
      fi
      FLAG_PATH="$2"
      shift 2
      ;;
    --path=*)
      FLAG_PATH="${1#--path=}"
      shift
      ;;
    --help)
      echo "Usage: $0 [--preview] [--path <path>] [commit message]"
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

COMMIT_MSG=${1:-"Auto update: $(date -u +"%Y-%m-%d %H:%M:%SZ")"}

# Check we are inside a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: this directory is not a git repository." >&2
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Compute the path of the script directory relative to the git repository root
# If script is in the repo root, use '.' as the target path
if [ "$SCRIPT_DIR" = "$REPO_ROOT" ]; then
  REL_PATH='.'
else
  REL_PATH=${SCRIPT_DIR#"$REPO_ROOT"/}
fi

# Target path precedence: explicit TARGET_PATH env var > --path flag > script relative path
TARGET_PATH="${TARGET_PATH:-}"
if [ -n "$TARGET_PATH" ]; then
  :
elif [ -n "$FLAG_PATH" ]; then
  TARGET_PATH="$FLAG_PATH"
else
  TARGET_PATH="$REL_PATH"
fi

TARGET_PATH="${TARGET_PATH%.}"  # trim trailing dot if any

# Ensure TARGET_PATH is relative to repo root
if [ -z "$TARGET_PATH" ] || [ "$TARGET_PATH" = '.' ]; then
  TARGET_PATH='.'
fi

# Basic validation
if [ "$TARGET_PATH" != '.' ] && [ ! -d "$TARGET_PATH" ] && [ ! -d "$REPO_ROOT/$TARGET_PATH" ]; then
  echo "Error: target path '$TARGET_PATH' does not exist." >&2
  exit 1
fi

echo "Repository: $REPO_ROOT"
echo "Target remote URL: $GIT_REMOTE_URL"
echo "Target branch: $GIT_BRANCH"
echo "Target path: $TARGET_PATH"
echo "Preview mode: $PREVIEW"

# Change to repo root so git operations use paths relative to repo root
cd "$REPO_ROOT" || exit 1

if [ "$PREVIEW" = true ]; then
  echo "PREVIEW: files that would be added/modified under '$TARGET_PATH':"
  # Use git add -n to show what would be added
  git add -n -A -- "$TARGET_PATH" 2>&1 || echo "(no changes)"
  echo
  echo "PREVIEW: nothing will be committed or pushed. To proceed, run without --preview."
  exit 0
fi

# Stage only files in the target path
# git add will handle the path resolution relative to repo root
# Exclude venv and cache directories
git add -A -- "$TARGET_PATH" ':(exclude)venv/' ':(exclude)__pycache__/' ':(exclude).cache/'

# Commit if there are staged changes
if git diff --cached --quiet; then
  echo "No changes to commit." 
else
  echo "Creating commit..."
  git commit -m "$COMMIT_MSG"
fi

# Push current HEAD to remote branch (without needing a named remote)
# This will create/update the remote branch $GIT_BRANCH to point at the current commit.
echo "Pushing to $GIT_REMOTE_URL -> $GIT_BRANCH..."
if git push --set-upstream "$GIT_REMOTE_URL" "HEAD:$GIT_BRANCH"; then
  echo "Push succeeded."
else
  echo "Push failed. Trying to display useful info..." >&2
  git remote -v || true
  git status --porcelain || true
  exit 2
fi

# Optionally push tags (if any)
if git tag --list | grep -q .; then
  echo "Pushing tags..."
  git push "$GIT_REMOTE_URL" --tags || true
fi

echo "Done. Current branch remains: $(git rev-parse --abbrev-ref HEAD)"

echo "Note: Ensure you have access (SSH key or credentials) for $GIT_REMOTE_URL."