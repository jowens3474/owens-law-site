"""Anthropic chat models for the appellate brief-writing agent.

Opus 4.8 is the workhorse for every node. Claude Fable 5 is available as an
opt-in for the heaviest long-horizon work (e.g. a final whole-brief synthesis
pass) — it is Anthropic's most capable model but ~2x the cost, with
minutes-long turns and a 30-day data-retention requirement.

Notes on current Claude models (Opus 4.8/4.7, Fable 5) that drove this setup:

- ``temperature`` / ``top_p`` / ``top_k`` are removed and return a 400. The old
  "low temperature for legal precision" instinct no longer maps to a parameter;
  steer precision with the prompt and the ``effort`` control instead.
- Thinking is adaptive: ``{"type": "adaptive"}`` lets the model decide how much
  to reason. Omitting it runs with no thinking, which we don't want for issue
  analysis or drafting. (On Fable 5 thinking is always on; adaptive is accepted,
  an explicit ``{"type": "disabled"}`` is not.)
- ``effort`` (``low``/``medium``/``high``/``xhigh``/``max``) is the spend/quality
  dial, passed inside ``output_config`` (a direct ``ChatAnthropic`` kwarg).
- Past ~16K output tokens, set ``streaming=True`` to avoid SDK HTTP timeouts.
- Fable 5 can return ``stop_reason: "refusal"`` from its safety classifiers, so
  every Fable client opts into a server-side fallback to Opus 4.8 — a refused
  request is transparently re-served by Opus inside the same call.
"""

from langchain_anthropic import ChatAnthropic

# Demanding reasoning over long trial records → default to the most capable
# Opus-tier model. Pass model="claude-sonnet-4-6" for cheaper, faster nodes.
DEFAULT_MODEL = "claude-opus-4-8"

# Opt-in for the heaviest nodes only. Anthropic's most capable model.
FABLE_MODEL = "claude-fable-5"

# Fable refusals fall back here (and Sonnet/Opus high-volume nodes can too).
FALLBACK_MODEL = "claude-opus-4-8"

_SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-06-01"

# Token budgets. Briefs run 40-50 pages, but the graph drafts one section per
# call, so a per-call cap need only cover the longest single section — not the
# whole brief. PROSE_MAX_TOKENS gives generous headroom for that; above ~16K the
# SDK requires streaming to avoid HTTP timeouts, so prose models stream.
# Structured nodes emit data, not prose, so they stay small.
PROSE_MAX_TOKENS = 32000
STRUCTURED_MAX_TOKENS = 8192


def build_llm(
    model: str = DEFAULT_MODEL,
    max_tokens: int = 8192,
    effort: str = "high",
    streaming: bool = False,
    adaptive_thinking: bool = True,
) -> ChatAnthropic:
    """Construct a chat model for the graph's nodes.

    When ``model`` is Fable 5, a server-side refusal fallback to Opus 4.8 is
    wired automatically so a classifier decline doesn't fail the request.

    Set ``adaptive_thinking=False`` for structured-output nodes: forcing a tool
    call (how ``with_structured_output`` constrains the response) does not mix
    with thinking, and on Opus 4.8 omitting the thinking field is allowed.
    """
    kwargs = dict(
        model=model,
        max_tokens=max_tokens,
        output_config={"effort": effort},
        streaming=streaming,
    )
    if adaptive_thinking:
        kwargs["thinking"] = {"type": "adaptive"}
    if model == FABLE_MODEL:
        kwargs["betas"] = [_SERVER_SIDE_FALLBACK_BETA]
        kwargs["model_kwargs"] = {"fallbacks": [{"model": FALLBACK_MODEL}]}
    return ChatAnthropic(**kwargs)


def build_fable_llm(
    max_tokens: int = PROSE_MAX_TOKENS,
    effort: str = "high",
    streaming: bool = True,
) -> ChatAnthropic:
    """Fable 5 for the heaviest nodes (with Opus 4.8 refusal fallback).

    Defaults to the prose token budget with streaming on, since the nodes that
    warrant Fable produce long sections.
    """
    return build_llm(
        model=FABLE_MODEL, max_tokens=max_tokens, effort=effort, streaming=streaming
    )
