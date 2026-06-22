"""Anthropic chat model for the appellate brief-writing agent.

Notes on current Claude models (Opus 4.8/4.7, Sonnet 4.6) that drove this setup:

- ``temperature`` / ``top_p`` / ``top_k`` are removed and return a 400. The old
  "low temperature for legal precision" instinct no longer maps to a parameter;
  steer precision with the prompt and the ``effort`` control instead.
- Thinking is adaptive: ``{"type": "adaptive"}`` lets the model decide how much
  to reason. Omitting it runs with no thinking, which we don't want for issue
  analysis or drafting.
- ``effort`` (``low``/``medium``/``high``/``xhigh``/``max``) is the spend/quality
  dial, passed inside ``output_config`` (a direct ``ChatAnthropic`` kwarg).
- Past ~16K output tokens, set ``streaming=True`` to avoid SDK HTTP timeouts.
"""

from langchain_anthropic import ChatAnthropic

# Demanding reasoning over long trial records → default to the most capable
# Opus-tier model. Switch to "claude-sonnet-4-6" to trade some capability for
# lower cost/latency on high-volume sections.
DEFAULT_MODEL = "claude-opus-4-8"


def build_llm(
    model: str = DEFAULT_MODEL,
    max_tokens: int = 8192,
    effort: str = "high",
    streaming: bool = False,
) -> ChatAnthropic:
    """Construct the chat model used across the graph's nodes."""
    return ChatAnthropic(
        model=model,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        output_config={"effort": effort},
        streaming=streaming,
    )
