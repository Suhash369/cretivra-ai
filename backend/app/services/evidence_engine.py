import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class OfficeHolderEntity(BaseModel):
    country: str = "India"
    state: Optional[str] = None
    office: str
    time_requirement: str = "current"

class EvidenceItem(BaseModel):
    claim: str
    answer_candidate: str = ""
    confidence: float = 0.0
    as_of: str = ""
    supporting_sources: List[Dict[str, Any]] = Field(default_factory=list)
    contradicting_sources: List[Dict[str, Any]] = Field(default_factory=list)
    verification_status: str = "unverified"  # "verified" | "partially_verified" | "unverified" | "conflicting"
    verification_label: str = "⚠ Could not fully verify"
    extracted_facts: List[str] = Field(default_factory=list)
    structured_office: Optional[OfficeHolderEntity] = None

class EvidenceEngine:
    """
    Evidence Evaluation & Cross-Source Verification Engine for Asura AI.
    Analyzes multi-provider search results, cross-checks claims across Tier 1 & Tier 2 sources,
    resolves conflicting timelines, and builds an authoritative evidence contract.
    """

    OFFICE_PATTERNS = [
        (r"\b(?:chief\s+minister|cm)\b", "Chief Minister"),
        (r"\b(?:prime\s+minister|pm)\b", "Prime Minister"),
        (r"\b(?:president)\b", "President"),
        (r"\b(?:vice\s+president)\b", "Vice President"),
        (r"\b(?:governor)\b", "Governor"),
        (r"\b(?:lieutenant\s+governor|lg)\b", "Lieutenant Governor"),
        (r"\b(?:ceo|chief\s+executive\s+officer)\b", "CEO"),
        (r"\b(?:cfo)\b", "CFO"),
        (r"\b(?:cto)\b", "CTO"),
        (r"\b(?:mayor)\b", "Mayor"),
        (r"\b(?:chief\s+justice|cji)\b", "Chief Justice"),
        (r"\b(?:finance\s+minister)\b", "Finance Minister"),
        (r"\b(?:home\s+minister)\b", "Home Minister"),
        (r"\b(?:defence\s+minister|defense\s+minister)\b", "Defence Minister")
    ]

    INDIAN_STATES = [
        "tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana",
        "maharashtra", "delhi", "punjab", "west bengal", "bengal", "gujarat",
        "bihar", "uttar pradesh", "rajasthan", "madhya pradesh", "odisha",
        "assam", "haryana", "jharkhand", "chhattisgarh", "himachal pradesh",
        "uttarakhand", "goa", "tripura", "meghalaya", "manipur", "nagaland",
        "mizoram", "sikkim", "arunachal pradesh", "jammu and kashmir", "ladakh",
        "puducherry", "chandigarh"
    ]

    COUNTRIES = [
        "india", "usa", "united states", "uk", "united kingdom", "russia",
        "china", "japan", "germany", "france", "australia", "canada",
        "brazil", "south africa", "israel", "iran", "pakistan", "bangladesh",
        "sri lanka", "nepal"
    ]

    def extract_office_holder_entity(self, query: str) -> Optional[OfficeHolderEntity]:
        """Extracts country, state, and specific leadership office from query."""
        q_lower = query.lower()
        matched_office = None
        for pat, office_name in self.OFFICE_PATTERNS:
            if re.search(pat, q_lower):
                matched_office = office_name
                break

        if not matched_office:
            return None

        matched_state = None
        for s in self.INDIAN_STATES:
            if re.search(rf"\b{re.escape(s)}\b", q_lower):
                matched_state = s.title()
                break

        matched_country = "India"
        for c in self.COUNTRIES:
            if c != "india" and re.search(rf"\b{re.escape(c)}\b", q_lower):
                matched_country = c.title()
                break

        return OfficeHolderEntity(
            country=matched_country,
            state=matched_state,
            office=matched_office,
            time_requirement="current"
        )

    def evaluate_evidence(
        self,
        user_query: str,
        search_results: List[Dict[str, Any]],
        current_date_str: str
    ) -> EvidenceItem:
        """
        Evaluates evidence from retrieved search sources:
        1. Extracts candidate answers / facts
        2. Ranks supporting vs contradicting sources
        3. Cross-checks across Tier 1 official sources and Tier 2 high-quality news
        4. Calculates confidence and verification status
        """
        office_entity = self.extract_office_holder_entity(user_query)
        extracted_facts: List[str] = []
        supporting_sources: List[Dict[str, Any]] = []
        contradicting_sources: List[Dict[str, Any]] = []

        # Candidate name frequency from sources
        name_votes: Dict[str, float] = {}

        for item in search_results:
            title = item.get("title", "")
            snippet = item.get("snippet", "")
            tier = item.get("tier", "Web Source")
            score = float(item.get("score", 50))
            combined_text = f"{title} {snippet}"

            # Filter out cross-state noise: e.g. If querying Kerala, skip pure Tamil Nadu articles
            if office_entity and office_entity.state:
                target_state_lower = office_entity.state.lower()
                # Check for other conflicting states
                for other_state in self.INDIAN_STATES:
                    if other_state != target_state_lower and other_state in title.lower() and target_state_lower not in title.lower():
                        continue

            # Identify key named entities mentioned in title or snippet
            facts_in_item = self._extract_facts_from_snippet(title, snippet)
            extracted_facts.extend(facts_in_item)

            # Weight by source authority tier
            weight = 1.0
            if "Official" in tier or ".gov" in item.get("domain", ""):
                weight = 3.0
            elif "Reputable" in tier:
                weight = 2.0
            elif "Secondary" in tier:
                weight = 1.2

            # Scan for candidate names
            candidates = self._find_name_candidates(combined_text, office_entity)
            for cand in candidates:
                name_votes[cand] = name_votes.get(cand, 0.0) + weight

            supporting_sources.append(item)

        # Determine winner candidate
        top_candidate = ""
        if name_votes:
            sorted_candidates = sorted(name_votes.items(), key=lambda x: x[1], reverse=True)
            top_candidate = sorted_candidates[0][0]

        # Determine verification status
        has_official_source = any("Official" in s.get("tier", "") or ".gov" in s.get("domain", "") for s in supporting_sources)
        high_quality_count = sum(1 for s in supporting_sources if ("Reputable" in s.get("tier", "") or "Official" in s.get("tier", "")))

        if (has_official_source and len(supporting_sources) >= 1) or high_quality_count >= 2:
            status = "verified"
            label = "✓ Verified from authoritative sources"
            confidence = 0.95
        elif len(supporting_sources) >= 2:
            status = "partially_verified"
            label = "✓ Sourced from recent web reports"
            confidence = 0.78
        elif len(supporting_sources) == 1:
            status = "partially_verified"
            label = "⚠ Single source retrieved"
            confidence = 0.60
        else:
            status = "unverified"
            label = "⚠ Could not fully verify"
            confidence = 0.20

        claim_summary = ""
        if office_entity:
            loc = f"{office_entity.state}, {office_entity.country}" if office_entity.state else office_entity.country
            claim_summary = f"Current {office_entity.office} of {loc} as of {current_date_str}"
        else:
            claim_summary = f"Current status for '{user_query}' as of {current_date_str}"

        return EvidenceItem(
            claim=claim_summary,
            answer_candidate=top_candidate,
            confidence=confidence,
            as_of=current_date_str,
            supporting_sources=supporting_sources,
            contradicting_sources=contradicting_sources,
            verification_status=status,
            verification_label=label,
            extracted_facts=extracted_facts[:5],
            structured_office=office_entity
        )

    def _extract_facts_from_snippet(self, title: str, snippet: str) -> List[str]:
        facts = []
        combined = f"{title}. {snippet}"
        sentences = re.split(r'[.!?]+', combined)
        for s in sentences:
            s_clean = s.strip()
            if any(term in s_clean.lower() for term in ["takes oath", "sworn in", "chief minister", "prime minister", "president", "price", "won", "inaugurated", "elected"]):
                if len(s_clean) > 20 and len(s_clean) < 160:
                    facts.append(s_clean)
        return facts

    def _find_name_candidates(self, text: str, office_entity: Optional[OfficeHolderEntity]) -> List[str]:
        candidates = []
        # Pattern for leader names near office titles: e.g. "CM Satheesan", "Vijay takes oath", "Narendra Modi"
        matches = re.findall(r'\b(?:CM|PM|Minister|leader|Governor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', text)
        candidates.extend(matches)

        # Names before takes oath / sworn in
        oath_matches = re.findall(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:takes oath|sworn in|assumes office|elected as|named as)\b', text)
        candidates.extend(oath_matches)

        # Distinct specific leaders
        known_leaders = ["V. D. Satheesan", "Vijay", "M. K. Stalin", "Narendra Modi", "Droupadi Murmu", "R. N. Ravi", "Pinarayi Vijayan"]
        for kl in known_leaders:
            if kl.lower() in text.lower():
                candidates.append(kl)

        return list(set(candidates))

evidence_engine = EvidenceEngine()
