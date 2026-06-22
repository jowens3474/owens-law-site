---
description: Run the build loop on a task. Plans (if vague) → builds → checks → reviews until ALL GREEN and approved.
argument-hint: <task>
allowed-tools: Read, Grep, Glob, Bash, Task
model: opus
---

Dispatch the `orchestrator` subagent with this task: $ARGUMENTS

Wait for its final summary and surface it as-is. Do not edit files
yourself. Do not bypass the orchestrator.
