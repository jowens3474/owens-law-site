"""Graph nodes for the appellate brief-writing agent.

Each node takes the current ``AppellateState`` plus the chat models it needs
and returns a partial state dict. The reducers declared on ``AppellateState``
(``operator.add`` for the lists, ``merge_dicts`` for ``argument_sections``)
combine these partials, so every node returns only what it produced.

Prose nodes use a thinking-enabled model; the two structured-output nodes
(``triage_issues``, ``critique``) use a thinking-disabled model because they
force a tool call to shape the response.
"""

from typing import List

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

from agent.state import AppellateState, Issue

# The critique loop exits as soon as the reviewer returns a clean verdict; this
# is only the safety cap so it can't spin forever. Set high to favor quality —
# keep polishing a flawed brief across several passes.
MAX_REVISIONS = 4


# --- Structured-output schemas -------------------------------------------------

class FactsResult(BaseModel):
    """Timeline-style facts extracted from the trial record."""

    facts: List[str] = Field(description="Chronological, record-cited facts.")


class TriageResult(BaseModel):
    """The appellate issues worth raising, strongest first."""

    issues: List[Issue]


class CritiqueResult(BaseModel):
    """A reviewer's read on the current draft."""

    needs_revision: bool = Field(description="True if the draft should be revised.")
    critiques: List[str] = Field(description="Specific, actionable problems.")


# --- Formatting helpers --------------------------------------------------------

def _format_record(trial_record: List[dict]) -> str:
    chunks = []
    for i, chunk in enumerate(trial_record):
        cite = chunk.get("source") or chunk.get("cite") or f"chunk {i + 1}"
        text = chunk.get("text") or chunk.get("content") or ""
        chunks.append(f"[{cite}] {text}")
    return "\n\n".join(chunks) if chunks else "(no record provided)"


def _format_facts(extracted_facts: List[dict]) -> str:
    return "\n".join(f"- {f.get('fact', '')}" for f in extracted_facts)


def _section_key(index: int, issue: Issue) -> str:
    return f"Issue {index + 1}: {issue.issue_name}"


def _text(message) -> str:
    """Pull plain text out of an AIMessage.

    With adaptive thinking on, ``message.content`` is a list of blocks
    (``thinking`` + ``text``) rather than a string; concatenate only the text.
    """
    content = message.content
    if isinstance(content, str):
        return content
    parts = []
    for block in content:
        if isinstance(block, str):
            parts.append(block)
        elif isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "".join(parts)


# --- Nodes ---------------------------------------------------------------------

def extract_facts(state: AppellateState, structured_llm: ChatAnthropic) -> dict:
    """Pull a clean, record-cited fact timeline from the trial record."""
    record = _format_record(state["trial_record"])
    result: FactsResult = structured_llm.with_structured_output(FactsResult).invoke(
        [
            SystemMessage(
                "You are an appellate attorney. Extract the material facts from "
                "the trial record as a neutral, chronological timeline. Each fact "
                "must be supported by the record; cite the bracketed source."
            ),
            HumanMessage(f"Trial record:\n\n{record}"),
        ]
    )
    facts = [{"fact": f} for f in result.facts]
    return {
        "extracted_facts": facts,
        "messages": [{"node": "extract_facts", "summary": f"{len(facts)} facts"}],
    }


def triage_issues(state: AppellateState, structured_llm: ChatAnthropic) -> dict:
    """Identify the appellate issues worth raising, ranked by strength."""
    record = _format_record(state["trial_record"])
    result: TriageResult = structured_llm.with_structured_output(TriageResult).invoke(
        [
            SystemMessage(
                "You are an appellate strategist. Given the trial record and the "
                "appeal goal, identify the strongest preserved issues. For each, "
                "set the standard of review, key record citations, and a candid "
                "strength score from 0 to 1."
            ),
            HumanMessage(
                f"Appeal goal: {state['appeal_goal']}\n\nTrial record:\n\n{record}"
            ),
        ]
    )
    return {
        "issues": result.issues,
        "messages": [{"node": "triage_issues", "summary": f"{len(result.issues)} issues"}],
    }


def research_issues(state: AppellateState, llm: ChatAnthropic) -> dict:
    """Draft a short research memo per issue (controlling authority, standard)."""
    research = []
    for issue in state["issues"]:
        memo = llm.invoke(
            [
                SystemMessage(
                    "You are an appellate research attorney. Write a concise memo "
                    "on the issue: controlling authority, the standard of review, "
                    "and how the law applies to these facts. Flag adverse authority."
                ),
                HumanMessage(
                    f"Issue: {issue.issue_name}\nStandard of review: "
                    f"{issue.standard_of_review}\nDescription: {issue.description}\n"
                    f"Key citations: {', '.join(issue.key_record_citations)}"
                ),
            ]
        )
        research.append({"issue": issue.issue_name, "memo": _text(memo)})
    return {
        "legal_research": research,
        "messages": [{"node": "research_issues", "summary": f"{len(research)} memos"}],
    }


def draft_statement_of_facts(state: AppellateState, llm: ChatAnthropic) -> dict:
    """Write the Statement of Facts from the extracted timeline."""
    facts = _format_facts(state["extracted_facts"])
    draft = llm.invoke(
        [
            SystemMessage(
                "You are an appellate brief writer. Write a persuasive but scrupulously "
                "accurate Statement of Facts from the fact timeline. Every sentence "
                "must trace to a listed fact; keep record citations."
            ),
            HumanMessage(f"Appeal goal: {state['appeal_goal']}\n\nFacts:\n{facts}"),
        ]
    )
    return {
        "statement_of_facts": _text(draft),
        "messages": [{"node": "draft_statement_of_facts", "summary": "drafted"}],
    }


def draft_arguments(state: AppellateState, llm: ChatAnthropic) -> dict:
    """Draft one argument section per issue."""
    sections = {}
    research_by_issue = {r["issue"]: r["memo"] for r in state["legal_research"]}
    for i, issue in enumerate(state["issues"]):
        section = llm.invoke(
            [
                SystemMessage(
                    "You are an appellate brief writer. Draft a complete argument "
                    "section for this issue: lead with the standard of review, state "
                    "the rule, apply it to the record, and address counterarguments."
                ),
                HumanMessage(
                    f"Appeal goal: {state['appeal_goal']}\n"
                    f"Issue: {issue.issue_name}\n"
                    f"Standard of review: {issue.standard_of_review}\n"
                    f"Research memo:\n{research_by_issue.get(issue.issue_name, '')}\n\n"
                    f"Statement of Facts:\n{state.get('statement_of_facts', '')}"
                ),
            ]
        )
        sections[_section_key(i, issue)] = _text(section)
    return {
        "argument_sections": sections,
        "messages": [{"node": "draft_arguments", "summary": f"{len(sections)} sections"}],
    }


def critique(state: AppellateState, structured_llm: ChatAnthropic) -> dict:
    """Review the drafted sections and decide whether another pass is needed."""
    sections = "\n\n".join(
        f"## {name}\n{text}" for name, text in state["argument_sections"].items()
    )
    result: CritiqueResult = structured_llm.with_structured_output(CritiqueResult).invoke(
        [
            SystemMessage(
                "You are a demanding appellate reviewer. Identify concrete, "
                "actionable problems in the argument sections: weak record support, "
                "missed counterarguments, misstated standards, or unpersuasive "
                "structure. If the draft is strong, set needs_revision to false."
            ),
            HumanMessage(f"Appeal goal: {state['appeal_goal']}\n\n{sections}"),
        ]
    )
    return {
        "critiques": result.critiques,
        "needs_revision": result.needs_revision,
        "messages": [
            {
                "node": "critique",
                "summary": f"needs_revision={result.needs_revision}, "
                f"{len(result.critiques)} notes",
            }
        ],
    }


def revise(state: AppellateState, llm: ChatAnthropic) -> dict:
    """Re-draft each argument section to address the latest critiques."""
    critiques = "\n".join(f"- {c}" for c in state["critiques"])
    sections = {}
    for i, issue in enumerate(state["issues"]):
        key = _section_key(i, issue)
        revised = llm.invoke(
            [
                SystemMessage(
                    "You are an appellate brief writer revising a draft. Apply the "
                    "reviewer's critiques to strengthen the section without "
                    "introducing unsupported claims. Return the full revised section."
                ),
                HumanMessage(
                    f"Issue: {issue.issue_name}\n\nReviewer critiques:\n{critiques}\n\n"
                    f"Current section:\n{state['argument_sections'].get(key, '')}"
                ),
            ]
        )
        sections[key] = _text(revised)
    return {
        "argument_sections": sections,
        "revision_count": state.get("revision_count", 0) + 1,
        "messages": [
            {"node": "revise", "summary": f"pass {state.get('revision_count', 0) + 1}"}
        ],
    }


def assemble(state: AppellateState, llm: ChatAnthropic) -> dict:
    """Stitch the sections into the final brief."""
    body = [f"STATEMENT OF FACTS\n\n{state.get('statement_of_facts', '')}", "\nARGUMENT"]
    for name, text in state["argument_sections"].items():
        body.append(f"\n{name}\n\n{text}")
    return {
        "final_brief": "\n".join(body),
        "messages": [{"node": "assemble", "summary": "brief assembled"}],
    }


# --- Conditional edge ----------------------------------------------------------

def should_revise(state: AppellateState) -> str:
    """Route the critique loop: revise until clean or the revision cap is hit."""
    if state.get("needs_revision") and state.get("revision_count", 0) < MAX_REVISIONS:
        return "revise"
    return "assemble"
