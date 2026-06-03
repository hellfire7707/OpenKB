# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development install
pip install -e .

# Run all tests
pytest

# Run a single test file
pytest tests/test_compiler.py

# Run a single test by name
pytest tests/test_compiler.py::test_name

# Build distribution
hatch build

# Publish (triggered by v* git tag in CI)
hatch publish
```

Tests use `pytest-asyncio`; async tests are marked `@pytest.mark.asyncio`. Live LLM calls require `LLM_API_KEY` in the environment; most unit tests mock them.

## Architecture

OpenKB is a CLI that compiles raw documents (PDF, DOCX, HTML, etc.) into a structured, interlinked wiki using LLMs, then supports Q&A and skill generation over that wiki.

### Document → Wiki pipeline

1. **Conversion** (`converter.py`, `indexer.py`): Raw docs are converted to Markdown. Short PDFs use pymupdf; long PDFs (≥ `pageindex_threshold` pages, default 20) are routed through [PageIndex](https://github.com/VectifyAI/PageIndex) for hierarchical tree-based retrieval (no embeddings). Output lands in `wiki/sources/`.

2. **Compilation** (`agent/compiler.py`): Async LLM pipeline that produces:
   - `wiki/summaries/` — per-document summaries
   - `wiki/concepts/` — cross-document topic synthesis
   - `wiki/entities/` — named entities (person, org, place, etc.), configurable via `entity_types` in config
   - `wiki/index.md` and `wiki/log.md` — catalog and audit log

   Compilation uses Anthropic prompt caching: a shared base context (AGENTS.md + index + all summaries) is cached and reused across the 10–15 LLM calls per compilation run.

3. **Auto-generated content is overwritten on recompile.** The only exception: content inside `<!-- note -->...<!-- /note -->` markdown comment blocks in wiki pages, which the compiler preserves.

### Query / Chat layer

- `agent/query.py` — single-question Q&A with citation grounding
- `agent/chat.py` + `agent/chat_session.py` — multi-turn chat with session persistence, Rich rendering, and slash commands
- `agent/tools.py` — LLM tools that read wiki pages (concept, entity, summary retrieval)

### Skill subsystem (`skill/`)

Distills a subset of the compiled wiki into a redistributable Anthropic Skill (markdown bundle with frontmatter). Modules: `creator.py`, `evaluator.py`, `validator.py`, `workspace.py`, `marketplace.py`.

### CLI (`cli.py`)

Single large file (~87 KB) containing all Click commands: `init`, `add`, `remove`, `query`, `chat`, `watch`, `lint`, `recompile`, `skill`, `feedback`, `status`, `list`, `use`.

### Wiki directory layout (created inside a KB root)

```
wiki/
├── sources/      # converted doc content + images
├── summaries/    # per-document LLM summaries
├── concepts/     # cross-document topic pages
├── entities/     # named entity pages
├── explorations/ # saved query results
├── reports/      # lint reports
├── index.md
├── log.md
└── AGENTS.md     # LLM instruction manual (user-editable, read at runtime)
```

`wiki/AGENTS.md` is the runtime schema reference read by the LLM on every compile/query. User edits take effect immediately — it is never baked into compiled prompts.

### Configuration

Per-KB config at `.openkb/config.yaml`:

```yaml
model: gpt-4o          # LiteLLM model string
language: en
pageindex_threshold: 20
entity_types: [...]    # optional override of default entity types
```

Environment vars (`.env` in KB root or `~/.config/openkb/.env`):
- `LLM_API_KEY` — required; any LiteLLM provider key
- `PAGEINDEX_API_KEY` — optional; cloud PageIndex for OCR / fast indexing

### Key dependencies

- **LiteLLM** — provider-agnostic LLM calls (OpenAI, Anthropic, Gemini, DeepSeek, etc.)
- **PageIndex** — vectorless long-doc retrieval via hierarchical reasoning trees
- **markitdown** — general document → Markdown conversion
- **Rich** — terminal rendering for chat UI
- **Click** — CLI framework
- **watchdog** — filesystem watcher for `openkb watch`
