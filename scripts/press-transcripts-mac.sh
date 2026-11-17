#!/bin/bash
# The owner's Mac job that keeps press conference transcripts on hand for the
# sports desk. See scripts/press-transcripts-sync.mjs for why it runs on the
# Mac and not on GitHub.
#
# Installed copy: ~/press-transcripts-sync/
#   run.sh                              this file
#   bin/press-transcripts-sync.mjs      copy of scripts/press-transcripts-sync.mjs
#   bin/lib/press-conferences.mjs       copy of scripts/lib/press-conferences.mjs
#   data/                               clone of the claude/press-transcripts branch
#   sync.log                            what each run did
# launchd starts it every two hours and at login:
#   ~/Library/LaunchAgents/com.owens.press-transcripts.plist
# The installed copies are not pulled from GitHub automatically, so nothing
# pushed to main runs on the Mac unreviewed. After changing the two scripts,
# copy them over again.
#
# Each run: update the data clone, save new transcripts into data/transcripts,
# and commit and push any change to claude/press-transcripts. That branch
# holds only transcripts and its own vercel.json, which turns Vercel
# deployments off, so a push here never spends a site deploy.

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

BASE="${PRESS_SYNC_HOME:-$HOME/press-transcripts-sync}"
DATA="$BASE/data"
BRANCH="claude/press-transcripts"
REPO="https://github.com/jowens3474/owens-law-site.git"
LOG="$BASE/sync.log"

mkdir -p "$BASE"
# Keep the log short: the last 2,000 lines once it passes 1 MB.
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 1000000 ]; then
  tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
exec >> "$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z')"

# One run at a time. A lock older than an hour is from a run that died.
LOCK="$BASE/.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +60 2>/dev/null)" ]; then
    rmdir "$LOCK" && mkdir "$LOCK"
  else
    echo "another run is still going; skipped"
    exit 0
  fi
fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

git_data() {
  git -C "$DATA" -c credential.helper= -c "credential.helper=!gh auth git-credential" "$@"
}

if [ ! -d "$DATA/.git" ]; then
  git -c credential.helper= -c "credential.helper=!gh auth git-credential" \
    clone --quiet --single-branch --branch "$BRANCH" "$REPO" "$DATA"
fi
# Start from GitHub's copy every run. Clear any half-finished git operation
# first, so a past failure cannot leave the clone stuck.
git_data rebase --abort >/dev/null 2>&1 || true
git_data merge --abort >/dev/null 2>&1 || true
git_data fetch --quiet origin "$BRANCH"
git_data reset --quiet --hard "origin/$BRANCH"
git_data clean --quiet -fd

node "$BASE/bin/press-transcripts-sync.mjs" --out "$DATA/transcripts"

git_data add -A
if git_data diff --cached --quiet; then
  echo "no change to push"
  exit 0
fi
git_data -c user.name="Jackson Wire Press Transcripts" -c user.email="autopilot@thejacksonwire.com" \
  commit --quiet -m "Press transcripts: $(date '+%Y-%m-%d %H:%M') [skip ci]"
# Retry the push for network blips only. Nothing else pushes to this branch,
# so a rejected push is not merged here: the next run starts over from
# GitHub's copy and fetches these transcripts again.
for attempt in 1 2 3; do
  if git_data push --quiet origin "HEAD:$BRANCH"; then
    echo "pushed $(git_data rev-parse --short HEAD)"
    exit 0
  fi
  echo "push attempt $attempt failed"
  if [ "$attempt" -lt 3 ]; then sleep 15; fi
done
echo "push failed; the next run starts from GitHub's copy and fetches these transcripts again"
exit 1
