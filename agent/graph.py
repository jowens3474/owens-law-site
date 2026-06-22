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

Prose nodes run on a thinking-enabled model; the structured-output nodes run on
a thinking-disabled model (they force a tool call to shape the response). Pass
``heavy_llm`` to route the synthesis-heavy nodes (drafting/revision) to Fable 5.
"""

from functools import partial
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph, START, END

from agent import nodes
from agent.llm import build_llm
from agent.state import AppellateState


def build_graph(
    llm: Optional[ChatAnthropic] = None,
    structured_llm: Optional[ChatAnthropic] = None,
    heavy_llm: Optional[ChatAnthropic] = None,
):
    """Construct and compile the appellate brief graph.

    Args:
        llm: prose model (thinking on). Defaults to Opus 4.8.
        structured_llm: model for structured-output nodes (thinking off).
        heavy_llm: optional model for drafting/revision — e.g. ``build_fable_llm()``
            to run the heaviest synthesis on Fable 5. Defaults to ``llm``.
    """
    llm = llm or build_llm()
    structured_llm = structured_llm or build_llm(adaptive_thinking=False)
    heavy_llm = heavy_llm or llm

    graph = StateGraph(AppellateState)

    graph.add_node("extract_facts", partial(nodes.extract_facts, structured_llm=structured_llm))
    graph.add_node("triage_issues", partial(nodes.triage_issues, structured_llm=structured_llm))
    graph.add_node("research_issues", partial(nodes.research_issues, llm=llm))
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
