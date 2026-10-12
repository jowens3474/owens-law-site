#!/usr/bin/env bash
# Starts the Social and Instagram posters after a desk publishes a story.
#
# The desks (Autopilot, the Morning Brief, Sales tax) push with their
# workflow's own token, and GitHub starts no other workflow from such a push,
# so the lib/posts.ts push trigger on social.yml and instagram.yml fires only
# for people's pushes and merges. The posters take only stories dated today
# in Chicago, so a story published after that day's scheduled run would never
# be posted. Each desk workflow notes the commit it started from and runs
# this script last; workflow_dispatch is the one event a workflow token may
# start.
#
# It compares against origin/main, not the local HEAD, so a story whose push
# was rejected is not handed off. Both posters are tried even if one fails,
# and any failure exits non-zero, so the desk run turns red: the daily cron
# cannot recover a story published after it ran.
#
# Usage: scripts/hand-off-social.sh <start-sha>
# Needs GH_TOKEN with actions: write.
set -u

start="${1:-}"
git fetch --quiet origin main || true

if [ -z "$start" ] || git diff --quiet "$start" origin/main -- lib/posts.ts; then
  echo "No new story on main from this run; nothing to hand off."
  exit 0
fi

rc=0
for workflow in social.yml instagram.yml; do
  if gh workflow run "$workflow" --ref main -f wait_for_deploy=true; then
    echo "Started $workflow for the new story."
  else
    echo "::error::Could not start $workflow; today's new story may go unposted there."
    rc=1
  fi
done
exit "$rc"
