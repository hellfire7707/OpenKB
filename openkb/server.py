import json
import re
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


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

# 김정민 20260603 추가 — 채팅 세션 인메모리 저장소
_sessions: dict[str, list] = {}


class ChatRequest(BaseModel):  # 김정민 20260603 추가
    message: str
    session_id: str


def _setup_env(kb_dir: Path) -> None:
    """KB .env와 글로벌 .env를 로드하고 LLM_API_KEY를 provider 키에 전파."""
    # 김정민 20260603 추가
    import os
    import litellm
    from dotenv import load_dotenv
    from openkb.config import GLOBAL_CONFIG_DIR, load_config

    env_file = kb_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file, override=False)

    global_env = GLOBAL_CONFIG_DIR / ".env"
    if global_env.exists():
        load_dotenv(global_env, override=False)

    api_key = os.environ.get("LLM_API_KEY", "")
    if not api_key:
        return

    litellm.api_key = api_key

    config = load_config(kb_dir / ".openkb" / "config.yaml")
    model = str(config.get("model", ""))
    provider = model.split("/")[0].upper() if "/" in model else None

    provider_keys = [
        "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY",
        "DEEPSEEK_API_KEY", "OLLAMA_API_KEY",
    ]
    if provider:
        pkey = f"{provider}_API_KEY"
        if not os.environ.get(pkey):
            os.environ[pkey] = api_key
    for key in provider_keys:
        if not os.environ.get(key):
            os.environ[key] = api_key


def create_app(wiki_dir: Path) -> FastAPI:
    _setup_env(wiki_dir.parent)  # 김정민 20260603 추가
    app = FastAPI(title="OpenKB Web", docs_url=None, redoc_url=None)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_methods=["GET", "POST"],  # 김정민 20260603 수정 — POST 추가
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

    # 김정민 20260603 추가 — 채팅 엔드포인트
    @app.post("/api/chat")
    async def chat_endpoint(body: ChatRequest):
        from agents import Runner, RawResponsesStreamEvent
        from openai.types.responses import ResponseTextDeltaEvent
        from openkb.agent.query import build_query_agent
        from openkb.config import load_config

        config = load_config(wiki_dir.parent / ".openkb" / "config.yaml")
        model = config.get("model", "gpt-4o")
        language = config.get("language", "en")

        prev = _sessions.get(body.session_id, [])
        input_data: str | list = (
            prev + [{"role": "user", "content": body.message}] if prev else body.message
        )

        async def event_stream():
            try:
                agent = build_query_agent(str(wiki_dir), model, language=language)
                run_result = Runner.run_streamed(agent, input_data, max_turns=50)
                async for event in run_result.stream_events():
                    if isinstance(event, RawResponsesStreamEvent):
                        if isinstance(event.data, ResponseTextDeltaEvent):
                            if event.data.delta:
                                yield f"data: {json.dumps({'text': event.data.delta})}\n\n"
                _sessions[body.session_id] = run_result.to_input_list()
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    static_dir = Path(__file__).parent / "static"
    if static_dir.exists():
        app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

    return app
