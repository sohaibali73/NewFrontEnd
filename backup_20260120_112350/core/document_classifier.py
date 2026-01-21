import anthropic
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import json
import re

@dataclass
class ClassificationResult:
    primary_category: str
    confidence: float
    subcategories: List[str]
    key_topics: List[str]
    summary: str
    suggested_tags: List[str]

class AIDocumentClassifier:
    """Uses Claude API to intelligently classify and categorize documents."""

    # Dynamic categories that can grow
    BASE_CATEGORIES = {
        "afl_templates": "AFL code templates, coding patterns, and style guides for AmiBroker",
        "afl_functions": "AFL function references, syntax documentation, and language guides",
        "strategies": "Trading strategies, systems, entry/exit rules, and signal generation",
        "quant_finance": "Quantitative finance theory, research papers, market analysis",
        "backtest_rules": "Backtesting methodology, validation rules, and optimization guides",
        "risk_management": "Position sizing, risk metrics, portfolio management",
        "market_data": "Data handling, feeds, import/export procedures",
        "indicators": "Technical indicators, oscillators, and custom calculations"
    }

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key
        self.model = model
        self.client = None
        self.custom_categories: Dict[str, str] = {}

        if api_key:
            self._init_client()

    def _init_client(self):
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

    def update_api_key(self, new_key: str):
        self.api_key = new_key
        self._init_client()

    def get_all_categories(self) -> Dict[str, str]:
        """Get all available categories (base + custom)."""
        return {**self.BASE_CATEGORIES, **self.custom_categories}

    def add_custom_category(self, name: str, description: str):
        """Add a new category dynamically."""
        self.custom_categories[name] = description

    def classify_document(self, content: str, filename: str = "") -> ClassificationResult:
        """Use Claude to analyze and classify document content."""
        if not self.client:
            return self._fallback_classification(content, filename)

        categories = self.get_all_categories()
        categories_desc = "\n".join([f"- {k}: {v}" for k, v in categories.items()])

        # Truncate content for classification (save tokens)
        content_sample = content[:8000] if len(content) > 8000 else content

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system="""You are a document classification expert for a quantitative trading hedge fund.
Analyze documents and classify them into the most appropriate category.

Respond ONLY with valid JSON in this exact format:
{
    "primary_category": "category_name",
    "confidence": 0.95,
    "subcategories": ["sub1", "sub2"],
    "key_topics": ["topic1", "topic2", "topic3"],
    "summary": "Brief 1-2 sentence summary of document content",
    "suggested_tags": ["tag1", "tag2"]
}""",
                messages=[{
                    "role": "user",
                    "content": f"""Classify this document into ONE of these categories:

{categories_desc}

If the document doesn't fit well into any category, suggest a new category name.

Filename: {filename}

Document content:
{content_sample}"""
                }]
            )

            result_text = response.content[0].text
            # Extract JSON from response
            json_match = re.search(r'\{[^{}]*\}', result_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())

                # Handle new category suggestion
                if data["primary_category"] not in categories:
                    self.add_custom_category(
                        data["primary_category"],
                        f"Auto-created: {data.get('summary', 'No description')[:100]}"
                    )

                return ClassificationResult(
                    primary_category=data.get("primary_category", "quant_finance"),
                    confidence=float(data.get("confidence", 0.5)),
                    subcategories=data.get("subcategories", []),
                    key_topics=data.get("key_topics", []),
                    summary=data.get("summary", ""),
                    suggested_tags=data.get("suggested_tags", [])
                )
        except Exception as e:
            print(f"Classification error: {e}")

        return self._fallback_classification(content, filename)

    def _fallback_classification(self, content: str, filename: str) -> ClassificationResult:
        """Keyword-based fallback when API unavailable."""
        content_lower = content.lower()
        ext = filename.split('.')[-1].lower() if '.' in filename else ''

        # AFL detection
        afl_keywords = ['_section_begin', 'setoption', 'buy =', 'sell =',
                        'param(', 'optimize(', 'plot(', 'addcolumn']
        afl_score = sum(1 for kw in afl_keywords if kw in content_lower)

        if ext == 'afl' or afl_score >= 3:
            if 'optimize' in content_lower or 'param' in content_lower:
                return ClassificationResult("afl_templates", 0.7, [],
                                            ["afl", "template"], "AFL code template", ["afl"])
            return ClassificationResult("strategies", 0.6, [],
                                        ["afl", "strategy"], "AFL trading strategy", ["afl", "strategy"])

        # Strategy detection
        strategy_kw = ['entry', 'exit', 'signal', 'backtest', 'position']
        if sum(1 for kw in strategy_kw if kw in content_lower) >= 2:
            return ClassificationResult("strategies", 0.6, [],
                                        ["strategy"], "Trading strategy document", ["strategy"])

        # Quant finance detection
        quant_kw = ['volatility', 'correlation', 'sharpe', 'alpha', 'beta']
        if sum(1 for kw in quant_kw if kw in content_lower) >= 2:
            return ClassificationResult("quant_finance", 0.6, [],
                                        ["quantitative"], "Quantitative finance document", ["quant"])

        return ClassificationResult("quant_finance", 0.3, [],
                                    ["general"], "General document", ["unclassified"])

    def batch_classify(self, documents: List[Tuple[str, str]]) -> List[ClassificationResult]:
        """Classify multiple documents efficiently."""
        results = []
        for content, filename in documents:
            results.append(self.classify_document(content, filename))
        return results

    def analyze_and_suggest_structure(self, content: str) -> Dict:
        """Analyze document and suggest optimal chunking strategy."""
        if not self.client:
            return {"chunk_size": 512, "preserve_sections": False}

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{
                    "role": "user",
                    "content": f"""Analyze this document structure and suggest:
1. Optimal chunk size (256, 512, 1024)
2. Whether to preserve section boundaries
3. Key sections to keep intact

Document preview:
{content[:3000]}

Respond as JSON: {{"chunk_size": N, "preserve_sections": bool, "key_sections": []}}"""
                }]
            )

            json_match = re.search(r'\{[^{}]*\}', response.content[0].text)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass

        return {"chunk_size": 512, "preserve_sections": False, "key_sections": []}
