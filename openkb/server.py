import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


def _parse_md(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    text = path.read_text(encoding="utf-8")
    content = text
    if text.startswith("---"):
        end = text.find("---", 3)
        if end != -1:
            content = text[end + 3:].lstrip()
    title = path.stem.replace("-", " ").replace("_", " ").title()
    if m := re.search(r"^#\s+(.+)$", content, re.MULTILINE):
        title = m.group(1)
    return {"id": path.stem, "title": title, "content": content}


def _list_md(directory: Path) -> list:
    if not directory.exists():
        return []
    result = []
    for f in sorted(directory.glob("*.md")):
        data = _parse_md(f)
        lines = [ln for ln in data["content"].split("\n") if ln.strip() and not ln.startswith("#")]
        excerpt = lines[0][:200] if lines else ""
        result.append({"id": data["id"], "title": data["title"], "excerpt": excerpt})
    return result


_VALID_SECTIONS = {"summaries", "concepts", "entities"}


def create_app(wiki_dir: Path) -> FastAPI:
    app = FastAPI(title="OpenKB Web", docs_url=None, redoc_url=None)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    @app.get("/api/wiki/index")
    def get_index():
        return _parse_md(wiki_dir / "index.md")

    @app.get("/api/wiki/log")
    def get_log():
        return _parse_md(wiki_dir / "log.md")

    @app.get("/api/wiki/{section}")
    def list_section(section: str):
        if section not in _VALID_SECTIONS:
            raise HTTPException(status_code=404, detail="Unknown section")
        return _list_md(wiki_dir / section)

    @app.get("/api/wiki/{section}/{item_id}")
    def get_item(section: str, item_id: str):
        if section not in _VALID_SECTIONS:
            raise HTTPException(status_code=404, detail="Unknown section")
        if "/" in item_id or ".." in item_id:
            raise HTTPException(status_code=400, detail="Invalid id")
        return _parse_md(wiki_dir / section / f"{item_id}.md")

    static_dir = Path(__file__).parent / "static"
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app
