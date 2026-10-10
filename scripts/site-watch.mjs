#!/usr/bin/env node
// Site Watch: the Jackson Wire's smoke alarm. It checks two things and keeps
// at most two GitHub issues in step with them, so the owner gets one
// notification when something breaks and one when it recovers:
//
//   site-down        the live home page does not answer 200
//   deploys-failing  Vercel's status on the newest main commit that has one
//                    is failure or error
//
// For each label it opens an issue when the problem is true and no open issue
// carries that label, closes the issue with a short comment when the problem
// clears, and does nothing otherwise. It publishes nothing and commits
// nothing. Issues are public, so they hold only a status code, a time in
// Central, what it usually means, and where to look.
//
// Env:
//   GITHUB_TOKEN        contents: read, statuses: read, issues: write
//   GITHUB_REPOSITORY   owner/name (Actions sets it)
//   SITE                default https://www.thejacksonwire.com
//   RETRY_WAIT_SECONDS  pause between the home page's three tries, default 10
//   GITHUB_SERVER_URL, GITHUB_RUN_ID, GITHUB_API_URL (Actions sets them)
// Run every 30 minutes by .github/workflows/site-watch.yml. The exit code is 0
// unless the script itself crashes: an API or network error becomes a log line.
// The token is sent only to the GitHub API and is never printed or posted.

import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { formatChicago, oneLine, probe, reasonOf, vercelStatusOf, warning } from "./status-report.mjs";

const DEFAULT_SITE = "https://www.thejacksonwire.com";
const HOME_TRIES = 3; // a blip on one request must not open an issue
const COMMITS_TO_SCAN = 10; // how far back to look for a commit Vercel has a status for
const FETCH_TIMEOUT_MS = 20000;
const VERCEL_DASHBOARD = "https://vercel.com/dashboard";

export const LABELS = {
  "site-down": { color: "b60205", description: "Opened by Site Watch when the home page is not up" },
  "deploys-failing": { color: "d93f0b", description: "Opened by Site Watch when Vercel's newest deploy failed" },
};

const log = (message) => console.log(`[site-watch] ${message}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Judging what the checks saw
// ---------------------------------------------------------------------------

// `tries` are the home page's probe results, oldest first. One 200 is enough:
// the site is up. Otherwise it is down, and the last try says how.
export function homeVerdict(tries) {
  if (tries.some((t) => t.ok && t.status === 200)) return { state: "up", status: 200, error: "" };
  const last = tries[tries.length - 1];
  return last.ok ? { state: "down", status: last.status, error: "" } : { state: "down", status: null, error: last.error };
}

export function describeHome(verdict) {
  if (verdict.state === "up") return "HTTP 200";
  return verdict.status ? `HTTP ${verdict.status}` : `no answer (${verdict.error})`;
}

// What a bad answer from the home page usually means, in plain words.
export function meaningOfHome(verdict) {
  const s = verdict.status;
  if (!s) return "The site did not answer at all. The domain, its DNS record, or Vercel may be down.";
  if (s === 402) return "Vercel has paused the account. That is a plan or billing limit, and every page stops answering.";
  if (s === 404) return "The home page was not found. A bad deploy or a missing page is likely.";
  if (s === 429) return "Vercel or the site is turning requests away because there are too many.";
  if (s >= 500) return "The site or Vercel is failing to serve pages.";
  if (s >= 300 && s < 400) return "The home page redirects somewhere that does not answer 200.";
  return "The home page gave an answer other than 200.";
}

// Opens, closes, or leaves alone. `health` is "bad", "good", or "unknown".
export function planFor(health, openCount) {
  if (health === "bad" && openCount === 0) return "open";
  if (health === "good" && openCount > 0) return "close";
  return "none";
}

// Cuts long text to `max` characters, ending in three periods.
const shorten = (text, max) => (text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text);

// Optional lines are null and drop out; an empty string stays as a blank line.
const runLine = (runUrl) => (runUrl ? `- **Check run:** ${runUrl}` : null);
const joinLines = (list) => list.filter((l) => l !== null).join("\n");

export function siteDownIssue({ site, verdict, nowMs, runUrl }) {
  const title = verdict.status ? `Site down: the home page returned ${verdict.status}` : "Site down: the home page did not answer";
  const body = joinLines([
    "Site Watch found that the Jackson Wire home page is not up.",
    "",
    `- **What it saw:** ${site}/ gave ${describeHome(verdict)}.`,
    `- **When:** ${formatChicago(nowMs)} Central.`,
    `- **What that usually means:** ${meaningOfHome(verdict)}`,
    `- **Where to look:** the Vercel dashboard (${VERCEL_DASHBOARD}), under the project's Deployments and Settings.`,
    runLine(runUrl),
    "",
    "This issue closes itself when the home page answers 200 again. If you close it by hand while the site is still down, the next check opens a new one.",
  ]);
  return { title, body };
}

export function deploysFailingIssue({ repoUrl, commit, vercel, nowMs, runUrl }) {
  const said = shorten(oneLine(vercel.description), 100);
  const title = said ? `Deploys failing: Vercel says "${said}"` : `Deploys failing: Vercel reports ${vercel.state}`;
  // The subject goes in backticks so the issue shows it as plain text: no links,
  // no @mentions, no markdown. A backtick inside it would end the quote early.
  const subject = shorten(oneLine(String(commit.commit?.message ?? "").split("\n")[0]).replace(/`/g, "'"), 100);
  const body = joinLines([
    "Site Watch found that Vercel did not deploy the newest commit on main that it tried to deploy.",
    "",
    `- **Vercel's state:** ${vercel.state}`,
    said ? `- **What Vercel said:** "${said}"` : null,
    `- **Commit:** [${commit.sha.slice(0, 7)}](${repoUrl}/commit/${commit.sha})${subject ? `, \`${subject}\`` : ""}`,
    `- **When:** ${formatChicago(nowMs)} Central.`,
    "- **What that usually means:** the Vercel account is blocked or paused, the plan's deploy limit was reached, or the build failed.",
    `- **Where to look:** the Vercel dashboard (${VERCEL_DASHBOARD}), under the project's Deployments. The failed deployment's page gives the reason.`,
    runLine(runUrl),
    "",
    "While deploys fail, new stories are saved on GitHub but do not reach the site. This issue closes itself when the newest deploy succeeds. If you close it by hand while deploys still fail, the next check opens a new one.",
  ]);
  return { title, body };
}

export function siteRecoveredComment({ nowMs, runUrl }) {
  return joinLines([`The home page answered 200 at ${formatChicago(nowMs)} Central. Closing this issue.`, runUrl ? `Check run: ${runUrl}` : null]);
}

export function deploysRecoveredComment({ commit, vercel, nowMs, runUrl }) {
  const said = shorten(oneLine(vercel.description), 100);
  return joinLines([
    `Vercel's newest deploy (commit ${commit.sha.slice(0, 7)}) is now ${vercel.state}${said ? `: "${said}"` : ""} as of ${formatChicago(nowMs)} Central. Closing this issue.`,
    runUrl ? `Check run: ${runUrl}` : null,
  ]);
}

// ---------------------------------------------------------------------------
// Network layer
// ---------------------------------------------------------------------------

async function githubRequest(ctx, method, path, body) {
  const res = await fetch(`${ctx.apiBase}${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TheJacksonWire-SiteWatch",
      Authorization: `Bearer ${ctx.token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = String((await res.json()).message || "").slice(0, 120);
    } catch {
      // the error body was not JSON
    }
    const err = new Error(`GitHub API ${res.status} on ${method} ${path.split("?")[0]}${detail ? ` (${detail})` : ""}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// Home page: up on the first 200, down only after every try fails.
async function checkHome(ctx) {
  const tries = [];
  for (let i = 0; i < HOME_TRIES; i += 1) {
    if (i > 0) await sleep(ctx.retryWaitMs);
    tries.push(await probe(`${ctx.site}/`));
    if (tries[i].ok && tries[i].status === 200) break;
  }
  return homeVerdict(tries);
}

// Deploys: the newest commit on main that Vercel has a status for. Commits with
// no Vercel status (state-only commits marked [skip ci]) are skipped.
async function checkDeploys(ctx) {
  const query = new URLSearchParams({ sha: "main", per_page: String(COMMITS_TO_SCAN) });
  const commits = await githubRequest(ctx, "GET", `/repos/${ctx.repo}/commits?${query}`);
  for (const commit of commits) {
    const vercel = vercelStatusOf(await githubRequest(ctx, "GET", `/repos/${ctx.repo}/commits/${commit.sha}/status`));
    if (vercel) return { state: { failed: "failing", deployed: "ok", pending: "pending" }[vercel.bucket], commit, vercel };
  }
  return { state: "unknown" };
}

async function openIssues(ctx, label) {
  const query = new URLSearchParams({ labels: label, state: "open", per_page: "20" });
  const issues = await githubRequest(ctx, "GET", `/repos/${ctx.repo}/issues?${query}`);
  return issues.filter((issue) => !issue.pull_request); // the issues endpoint lists pull requests too
}

// Creates the label when it is missing. True if this call created it.
async function ensureLabel(ctx, name) {
  try {
    await githubRequest(ctx, "GET", `/repos/${ctx.repo}/labels/${encodeURIComponent(name)}`);
    return false;
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  try {
    await githubRequest(ctx, "POST", `/repos/${ctx.repo}/labels`, { name, ...LABELS[name] });
    return true;
  } catch (err) {
    if (err.status === 422) return false; // another run made it first
    throw err;
  }
}

// Brings the issues for one label in step with `health` ("bad", "good", or
// "unknown"). `make()` builds the issue to open and `recovered()` the comment
// that closes it; both are only called when needed.
async function syncIssue(ctx, label, health, { make, recovered }) {
  if (health === "unknown") {
    log(`${label}: no verdict this time, no change`);
    return;
  }
  try {
    const open = await openIssues(ctx, label);
    const plan = planFor(health, open.length);
    if (plan === "open") {
      if (await ensureLabel(ctx, label)) log(`${label}: created the label`);
      const { title, body } = make();
      const issue = await githubRequest(ctx, "POST", `/repos/${ctx.repo}/issues`, { title, body, labels: [label] });
      log(`${label}: opened issue #${issue.number}: ${title}`);
    } else if (plan === "close") {
      for (const issue of open) {
        // Close first and comment only if that worked. If the token cannot close
        // issues, every run would otherwise post the same comment again.
        await githubRequest(ctx, "PATCH", `/repos/${ctx.repo}/issues/${issue.number}`, { state: "closed", state_reason: "completed" });
        log(`${label}: closed issue #${issue.number}, the problem cleared`);
        try {
          await githubRequest(ctx, "POST", `/repos/${ctx.repo}/issues/${issue.number}/comments`, { body: recovered() });
        } catch (err) {
          log(`${label}: closed issue #${issue.number} but could not post the recovery comment: ${reasonOf(err)}`);
        }
      }
    } else {
      log(`${label}: ${health === "bad" ? "still a problem" : "fine"}, ${open.length} open: no change`);
    }
  } catch (err) {
    log(`${label}: could not update issues: ${reasonOf(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const retryEnv = process.env.RETRY_WAIT_SECONDS === undefined || process.env.RETRY_WAIT_SECONDS === "" ? NaN : Number(process.env.RETRY_WAIT_SECONDS);
  const repoEnv = process.env.GITHUB_REPOSITORY || "";
  const repo = /^[\w.-]+\/[\w.-]+$/.test(repoEnv) ? repoEnv : "";
  const serverUrl = (process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/+$/, "");
  const ctx = {
    site: (process.env.SITE || DEFAULT_SITE).replace(/\/+$/, ""),
    retryWaitMs: (Number.isFinite(retryEnv) && retryEnv >= 0 ? retryEnv : 10) * 1000,
    repo,
    token: process.env.GITHUB_TOKEN || "",
    apiBase: (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, ""),
  };
  const repoUrl = `${serverUrl}/${repo}`;
  const runUrl = repo && process.env.GITHUB_RUN_ID ? `${repoUrl}/actions/runs/${process.env.GITHUB_RUN_ID}` : "";
  const nowMs = Date.now();

  const home = await checkHome(ctx);
  log(`home page ${ctx.site}/: ${describeHome(home)}`);
  if (home.state === "down") console.log(warning("Site down", `The home page gave ${describeHome(home)}`));

  if (!ctx.token || !ctx.repo) {
    log(`${!ctx.token ? "GITHUB_TOKEN" : "GITHUB_REPOSITORY"} is not set: not checking deploys or managing issues`);
    return;
  }

  let deploys = { state: "unknown" };
  try {
    deploys = await checkDeploys(ctx);
    if (deploys.state === "unknown") log(`deploys: none of the newest ${COMMITS_TO_SCAN} commits on main has a Vercel status`);
    else log(`deploys: commit ${deploys.commit.sha.slice(0, 7)} is ${deploys.vercel.state}, "${oneLine(deploys.vercel.description)}"`);
  } catch (err) {
    log(`deploys: could not read Vercel's status: ${reasonOf(err)}`);
  }
  if (deploys.state === "failing") console.log(warning("Deploys failing", `Vercel says "${oneLine(deploys.vercel.description)}"`));

  await syncIssue(ctx, "site-down", { down: "bad", up: "good" }[home.state], {
    make: () => siteDownIssue({ site: ctx.site, verdict: home, nowMs, runUrl }),
    recovered: () => siteRecoveredComment({ nowMs, runUrl }),
  });
  await syncIssue(ctx, "deploys-failing", { failing: "bad", ok: "good" }[deploys.state] ?? "unknown", {
    make: () => deploysFailingIssue({ repoUrl, commit: deploys.commit, vercel: deploys.vercel, nowMs, runUrl }),
    recovered: () => deploysRecoveredComment({ commit: deploys.commit, vercel: deploys.vercel, nowMs, runUrl }),
  });
}

// Run only when started from the command line, so tests can import the functions.
const entry = process.argv[1] ? realpathSync(process.argv[1]) : "";
if (entry === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(`[site-watch] FAILED: ${reasonOf(err)}`);
    process.exit(1);
  });
}
