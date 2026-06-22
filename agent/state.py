"""State schema for the appellate brief-writing agent.

The graph builds an appellate brief in stages: it triages issues from the
trial record, extracts facts, runs legal research, drafts argument sections,
critiques and revises them, then assembles a final brief. The reducers below
let multiple nodes contribute to the same channels without clobbering one
another.
"""

from typing import TypedDict, Annotated, List, Optional
import operator

from pydantic import BaseModel


class Issue(BaseModel):
    """A candidate appellate issue identified from the trial record."""

    issue_name: str
    description: str
    strength: float  # 0-1
    key_record_citations: List[str]
    standard_of_review: str


def merge_dicts(current: dict, update: dict) -> dict:
    """Reducer that merges new keys into an existing dict channel.

    LangGraph calls reducers as ``reducer(current, update)``. ``operator.setitem``
    cannot be used here because it expects ``(obj, key, value)`` and returns
    ``None``; this merges instead, so nodes can write one section at a time
    (e.g. ``{"argument_sections": {"Issue 1": "..."}}``).
    """
    return {**(current or {}), **update}


class AppellateState(TypedDict):
    # Input
    appeal_goal: str                      # e.g., "Seek reversal on evidentiary error"
    trial_record: List[dict]              # metadata + text chunks from transcripts/exhibits

    # Progress
    issues: Annotated[List[Issue], operator.add]
    extracted_facts: Annotated[List[dict], operator.add]   # timeline-style facts
    legal_research: Annotated[List[dict], operator.add]

    # Drafting
    statement_of_facts: str
    argument_sections: Annotated[dict, merge_dicts]        # {"Issue 1": "...", ...}
    current_draft_section: Optional[str]

    # Critique & Revision
    critiques: Annotated[List[str], operator.add]
    revision_count: int

    # Final
    final_brief: Optional[str]
    messages: Annotated[List[dict], operator.add]          # full audit trail
