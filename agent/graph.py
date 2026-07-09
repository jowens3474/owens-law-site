"""LangGraph wiring for the appellate brief-writing agent.

Pipeline::

    START
      → extract_facts            (structured)
      → triage_issues            (structured)
      → research_issues
      → draft_statement_of_facts
      → draft_arguments
      → critique                 (structured)
          ├─ needs_revision & under cap → revise → critique  (loop)
          └─ otherwise                  → assemble → END

This is tuned for quality over cost. The generative nodes (research, statement
of facts, argument drafting, revision) default to Fable 5 — Anthropic's most
capable model — at ``max`` effort with the Opus 4.8 refusal fallback wired in.
The structured-output nodes (fact extraction, issue triage, critique) stay on
Opus 4.8 with thinking off: they force a tool call, which can't combine with
Fable's always-on thinking, so Opus 4.8 is the most capable model that fits.
"""

from functools import partial
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, START, END

from agent import nodes
from agent.llm import build_llm, build_fable_llm, PROSE_MAX_TOKENS, STRUCTURED_MAX_TOKENS
from agent.state import AppellateState


def build_graph(
    llm: Optional[ChatAnthropic] = None,
    structured_llm: Optional[ChatAnthropic] = None,
    heavy_llm: Optional[ChatAnthropic] = None,
):
    """Construct and compile the appellate brief graph.

    Args:
        llm: prose fallback model (thinking on). Defaults to Opus 4.8; used for
            ``assemble`` and as a conservative override target.
        structured_llm: model for structured-output nodes (thinking off).
            Defaults to Opus 4.8 — the most capable model that supports forced
            tool calls.
        heavy_llm: model for the generative nodes (research, drafting, revision).
            Defaults to Fable 5 at ``max`` effort with an Opus 4.8 refusal
            fallback. Pass ``build_llm()`` here to keep everything on Opus.
    """
    # Prose fallback (assemble has no LLM call; this is the safe default target).
    llm = llm or build_llm(max_tokens=PROSE_MAX_TOKENS, streaming=True)
    structured_llm = structured_llm or build_llm(
        max_tokens=STRUCTURED_MAX_TOKENS, adaptive_thinking=False
    )
    # Quality-first default: the most capable model at max effort on every
    # generative node. Streaming is required at this token budget.
    heavy_llm = heavy_llm or build_fable_llm(max_tokens=PROSE_MAX_TOKENS, effort="max")

    graph = StateGraph(AppellateState)

    graph.add_node("extract_facts", partial(nodes.extract_facts, structured_llm=structured_llm))
    graph.add_node("triage_issues", partial(nodes.triage_issues, structured_llm=structured_llm))
    graph.add_node("research_issues", partial(nodes.research_issues, llm=heavy_llm))
    graph.add_node(
        "draft_statement_of_facts",
        partial(nodes.draft_statement_of_facts, llm=heavy_llm),
    )
    graph.add_node("draft_arguments", partial(nodes.draft_arguments, llm=heavy_llm))
    graph.add_node("critique", partial(nodes.critique, structured_llm=structured_llm))
    graph.add_node("revise", partial(nodes.revise, llm=heavy_llm))
    graph.add_node("assemble", partial(nodes.assemble, llm=llm))

    graph.add_edge(START, "extract_facts")
    graph.add_edge("extract_facts", "triage_issues")
    graph.add_edge("triage_issues", "research_issues")
    graph.add_edge("research_issues", "draft_statement_of_facts")
    graph.add_edge("draft_statement_of_facts", "draft_arguments")
    graph.add_edge("draft_arguments", "critique")
    graph.add_conditional_edges(
        "critique",
        nodes.should_revise,
        {"revise": "revise", "assemble": "assemble"},
    )
    graph.add_edge("revise", "critique")
    graph.add_edge("assemble", END)

    return graph.compile()


def initial_state(appeal_goal: str, trial_record: list[dict]) -> AppellateState:
    """Build a fully-initialized state so every channel has a starting value."""
    return {
        "appeal_goal": appeal_goal,
        "trial_record": trial_record,
        "issues": [],
        "extracted_facts": [],
        "legal_research": [],
        "statement_of_facts": "",
        "argument_sections": {},
        "current_draft_section": None,
        "critiques": [],
        "needs_revision": False,
        "revision_count": 0,
        "final_brief": None,
        "messages": [],
    }
