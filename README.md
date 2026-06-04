<div align="center">

<a href="https://openkb.ai">
  <img src="https://docs.pageindex.ai/images/openkb.png" alt="OpenKB (by PageIndex)" />
</a>

# OpenKB — 오픈 LLM 지식베이스

<p align="center"><i>긴 문서 확장 지원&nbsp; • &nbsp;추론 기반 검색&nbsp; • &nbsp;네이티브 멀티모달&nbsp; • &nbsp;벡터 DB 불필요</i></p>

</div>

---

# 📑 OpenKB란?

**OpenKB (Open Knowledge Base)** 는 LLM을 활용해 원본 문서를 구조화된 위키 형태의 지식베이스로 컴파일하는 오픈소스 CLI 도구입니다. 임베딩 없이 긴 문서를 처리하는 [**PageIndex**](https://github.com/VectifyAI/PageIndex)를 기반으로 합니다.

Andrej Karpathy가 제안한 [개념](https://x.com/karpathy/status/2039805659525644595)에서 출발했습니다: LLM이 요약, 개념 페이지, 교차 참조를 자동으로 생성하고 유지합니다. 질의할 때마다 처음부터 다시 도출하는 대신, 지식이 시간이 지날수록 축적됩니다.

### 기존 RAG와의 차이점

기존 RAG는 매 질의마다 문서에서 지식을 다시 찾습니다. 아무것도 쌓이지 않습니다. OpenKB는 지식을 한 번 컴파일해 영속적인 위키로 유지하며, 교차 참조는 이미 존재하고, 모순은 자동으로 플래그됩니다.

OpenKB는 두 개의 레이어로 구성됩니다: 지식을 컴파일·유지하는 **위키 기반**, 그리고 이를 유용한 결과물로 변환하는 **생성기** (query / chat / Skill Factory).

# 🚀 시작하기

### 설치

```bash
pip install openkb
```

<details>
<summary><i>다른 설치 방법</i></summary>

- **GitHub 최신 버전:**

  ```bash
  pip install git+https://github.com/VectifyAI/OpenKB.git
  ```

- **소스에서 설치** (개발용, 편집 가능):

  ```bash
  git clone https://github.com/VectifyAI/OpenKB.git
  cd OpenKB
  pip install -e .
  ```

</details>

### 빠른 시작

```bash
# 1. 지식베이스 디렉토리 생성
mkdir my-kb && cd my-kb

# 2. 지식베이스 초기화
openkb init

# 3. 문서 추가
openkb add paper.pdf
openkb add ~/papers/                            # 디렉토리 전체 추가
openkb add https://arxiv.org/pdf/2509.11420     # URL에서 가져오기

# 4. 질문하기
openkb query "주요 내용이 무엇인가요?"

# 5. 대화형 채팅
openkb chat

# 6. 위키를 재배포 가능한 스킬로 압축
openkb skill new my-expert "내 문서를 기반으로 전문가처럼 답변하기"
```

### LLM 설정

OpenKB는 [LiteLLM](https://github.com/BerriAI/litellm)을 통해 OpenAI, Claude, Gemini, Ollama 등 다양한 [LLM을 지원](https://docs.litellm.ai/docs/providers)합니다.

`openkb init` 실행 시 또는 [`.openkb/config.yaml`](#설정)에서 `provider/model` 형식으로 모델을 지정합니다 (예: `anthropic/claude-sonnet-4-6`). OpenAI 모델은 접두사 없이 사용 가능합니다 (예: `gpt-4o`).

`.env` 파일에 API 키를 설정합니다:

```bash
LLM_API_KEY=your_llm_api_key
```

# 🧩 동작 방식

### 아키텍처

```
raw/                              문서를 여기에 넣습니다
 │
 ├─ 짧은 문서 ──→ markitdown ──→ LLM이 전체 텍스트 읽기
 │                                     │
 ├─ 긴 PDF ────→ PageIndex ────→ LLM이 문서 트리 읽기
 │                                     │
 │                                     ▼
 │                         위키 컴파일 (LLM 사용)
 │                                     │
 ▼                                     ▼
wiki/                                  │            ← 기반
 ├── index.md            지식베이스 개요
 ├── log.md              작업 이력
 ├── AGENTS.md           위키 스키마 (LLM 지침)
 ├── sources/            전체 텍스트 변환본
 ├── summaries/          문서별 요약
 ├── concepts/           교차 문서 합성 ← 핵심
 ├── entities/           명명된 개체 (인물, 조직, 장소, 제품)
 ├── explorations/       저장된 질의 결과
 └── reports/            Lint 리포트
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
            query / chat         Skill Factory          (예정)
          (위키 기반 LLM 답변)   openkb skill new       ppt / 팟캐스트 /
                                → output/skills/        리포트 / …
                                + marketplace.json
```

### 짧은 문서 vs 긴 문서

| | 짧은 문서 | 긴 문서 (PDF ≥ 20페이지) |
|---|---|---|
| **변환** | markitdown → Markdown | PageIndex → 트리 인덱스 + 요약 |
| **이미지** | pymupdf로 인라인 추출 | PageIndex가 추출 |
| **LLM 읽기** | 전체 텍스트 | 문서 트리 |
| **결과** | 요약 + 개념 | 요약 + 개념 |

### 지식 컴파일

문서를 추가하면 LLM이:

1. **요약** 페이지 생성
2. 기존 **개념** 및 **엔티티** 페이지 읽기
3. 교차 문서 합성으로 개념 생성 또는 업데이트
4. **엔티티** 페이지 생성 또는 업데이트 (인물, 조직, 장소, 제품)
5. **인덱스** 및 **로그** 업데이트

문서 하나가 10~15개의 위키 페이지에 영향을 미칩니다. 각 문서가 기존 위키를 풍부하게 만들며 지식이 누적됩니다.

# ⚙️ 사용법

OpenKB 명령어는 두 레이어로 나뉩니다: **위키 기반** (지식 컴파일 및 관리)과 **생성기** (위키에서 결과물 생성).

## 🧱 위키 기반 — 컴파일 및 관리

| 명령어 | 설명 |
|---|---|
| `openkb init` | 새 지식베이스 초기화 (대화형) |
| <code>openkb&nbsp;add&nbsp;&lt;파일/디렉토리/URL&gt;</code> | 문서 추가 및 위키 컴파일. URL은 PDF(PageIndex/markitdown)와 HTML(trafilatura 본문 추출)을 자동 감지 |
| <code>openkb&nbsp;remove&nbsp;&lt;doc&gt;</code> | 문서 제거 및 연관 위키 페이지·이미지·레지스트리·PageIndex 상태 정리 (`--dry-run` 미리보기, `--keep-raw` / `--keep-empty`로 아티팩트 유지) |
| <code>openkb&nbsp;recompile&nbsp;[&lt;doc&gt;]&nbsp;[--all]</code> | 이미 인덱싱된 문서에 컴파일 파이프라인 재실행 (재인덱싱 없이). 요약 재생성 및 개념 페이지 재작성 — 수동 편집 내용은 덮어씀. `--dry-run` 미리보기, `--refresh-schema`로 `wiki/AGENTS.md`도 업데이트 |
| `openkb watch` | `raw/` 감시 후 새 파일 자동 컴파일 |
| `openkb lint` | 구조적·지식 건전성 검사 |
| `openkb list` | 인덱싱된 문서 및 개념 목록 |
| `openkb status` | 지식베이스 통계 확인 |
| `openkb serve` | 웹 뷰어 백엔드 시작 (기본 포트 9000) |
| <code>openkb&nbsp;feedback&nbsp;["msg"]</code> | GitHub 이슈 열어 피드백 제출 (`--type bug/feature/question`으로 태그 지정) |

## ✨ 생성기 — 위키에서 결과물 생성

| 명령어 | 출력 |
|---|---|
| <code>openkb&nbsp;query&nbsp;"질문"</code> | 인용이 포함된 근거 있는 답변 (`--save`로 `wiki/explorations/`에 저장) |
| `openkb chat` | 위키 기반 멀티턴 대화 세션 (`--resume`, `--list`, `--delete`로 세션 관리) |
| <code>openkb&nbsp;skill&nbsp;new&nbsp;&lt;이름&gt;&nbsp;"&lt;의도&gt;"</code> | `<kb>/output/skills/<이름>/`에 재배포 가능한 Anthropic Skill 생성 + `marketplace.json` 자동 업데이트 |
| <code>openkb&nbsp;skill&nbsp;validate&nbsp;[이름]</code> | 컴파일된 스킬 구조 검사 (프론트매터, 파일 크기, 위키링크, `--strict`로 scripts/ 표준 라이브러리 검사). `skill new` 완료 후 자동 실행 |
| <code>openkb&nbsp;skill&nbsp;eval&nbsp;&lt;이름&gt;</code> | 트리거 정확도 평가 — `description:` 필드가 제대로 동작하는지 확인. LLM이 평가 프롬프트 생성, 채점 LLM이 활성화 점수 매김. `--save`로 평가 세트 저장 |
| <code>openkb&nbsp;skill&nbsp;history&nbsp;&lt;이름&gt;</code> / <code>openkb&nbsp;skill&nbsp;rollback&nbsp;&lt;이름&gt;</code> | 반복 작업공간 — 덮어쓸 때마다 이전 버전을 `output/skills/<이름>-workspace/iteration-N/`에 저장하고 구조 diff 생성. 롤백으로 특정 버전 복원 |

### Query & Chat — 위키에 묻기

`openkb query "..."` 는 단발 질문에 답합니다. `openkb chat` 은 대화형으로 히스토리를 유지하며 주제를 깊이 파고들 수 있습니다.

```bash
openkb query "어텐션 스케일링에 대한 문헌은 무엇을 말하는가?"

openkb chat                       # 새 세션 시작
openkb chat --resume              # 가장 최근 세션 재개
openkb chat --resume 20260411     # ID로 재개 (고유 접두사도 가능)
openkb chat --list                # 모든 세션 목록
openkb chat --delete <id>         # 세션 삭제
```

채팅 안에서 `/`를 입력하면 슬래시 명령어를 사용할 수 있습니다 (Tab으로 자동완성):

- `/help` — 사용 가능한 명령어 목록
- `/status` — 지식베이스 상태 확인
- `/list` — 모든 문서 목록
- `/add <경로>` — 채팅을 종료하지 않고 문서 또는 디렉토리 추가
- `/skill new <이름> "<의도>"` — 현재 채팅에서 스킬 컴파일
- `/save [이름]` — 대화 내용을 `wiki/explorations/`에 저장
- `/clear` — 새 세션 시작 (현재 세션은 디스크에 유지)
- `/lint` — 지식베이스 lint 실행
- `/exit` — 종료 (Ctrl-D도 동작)

### 🛠 Skill Factory — *책 한 권 넣으면 디지털 전문가가 나옵니다*

`openkb skill new`는 위키의 일부를 [Anthropic Skill](https://docs.claude.com/en/docs/build-with-claude/skills)로 압축합니다. **Claude Code, Codex CLI, Gemini CLI, Cursor**가 네이티브로 설치·로드하는 이식 가능한 폴더입니다.

```bash
openkb skill new karpathy-thinking \
  "Karpathy 스타일로 트랜스포머와 어텐션을 추론하기"
```

생성 결과:

```
<kb>/output/skills/karpathy-thinking/
├── SKILL.md                   # YAML 프론트매터 + 사용 시점 + 접근 방식
├── references/                # 에이전트가 필요 시 로드하는 심화 자료
│   ├── methodology.md
│   └── key-quotes.md
└── (scripts/)                 # 선택 사항, 의도에 계산이 포함된 경우만
```

…그리고 `<kb>/.claude-plugin/marketplace.json`이 자동 업데이트되어 KB 전체를 한 줄로 설치할 수 있습니다.

**로컬 설치:**

```bash
cp -r output/skills/karpathy-thinking ~/.claude/skills/
```

**공유하기** — KB를 GitHub에 올리면 누구든:

```bash
npx skills@latest add <your-org>/<your-repo>
```

**채팅에서 반복 편집** — `openkb chat` 안에서 전체 파이프라인을 다시 실행하지 않고 정제 가능:

```
/skill new karpathy-thinking "Karpathy처럼 트랜스포머 추론하기"
[생성 스트리밍]
> description이 너무 일반적입니다, 트랜스포머 구현에 특화시켜 주세요
[에이전트가 SKILL.md 프론트매터를 수정]
```

**품질 검사** — 구조 검증, 트리거 정확도 평가, 히스토리/롤백:

```bash
# 구조 lint (skill new 완료 후 자동 실행)
openkb skill validate karpathy-thinking
openkb skill validate --strict          # 경고도 실패로 처리

# description이 실제로 동작하는지 확인
openkb skill eval karpathy-thinking --save

# 새 버전이 퇴행하면 히스토리 확인 후 롤백
openkb skill history karpathy-thinking
openkb skill rollback karpathy-thinking --to 2
```

### 설정

`openkb init`으로 초기화되며, `.openkb/config.yaml`에 저장됩니다:

```yaml
model: gpt-4o                    # LLM 모델 (LiteLLM 지원 프로바이더)
language: ko                     # 위키 출력 언어
pageindex_threshold: 20          # PageIndex 사용 PDF 페이지 임계값
```

`entity_types` (선택): 엔티티 페이지에 사용할 타입 목록을 YAML 리스트로 재정의. 생략 시 기본값 `person`, `organization`, `place`, `product`, `work`, `event`, `other` 사용.

모델 이름은 LiteLLM `provider/model` [형식](https://docs.litellm.ai/docs/providers) 사용 (OpenAI 모델은 접두사 생략 가능):

| 프로바이더 | 모델 예시 |
|---|---|
| OpenAI | `gpt-4o` |
| Anthropic | `anthropic/claude-sonnet-4-6` |
| Gemini | `gemini/gemini-2.5-pro-preview` |
| Ollama | `ollama/gemma4:e2b` |

### PageIndex 연동

긴 문서는 컨텍스트 한계와 컨텍스트 손실로 LLM이 처리하기 어렵습니다.
[PageIndex](https://github.com/VectifyAI/PageIndex)는 벡터 없이 추론 기반으로 계층적 트리 인덱스를 구축해 이 문제를 해결합니다.

PageIndex는 기본적으로 [오픈소스 버전](https://github.com/VectifyAI/PageIndex)으로 로컬에서 실행되며 외부 의존성이 없습니다.

#### 선택: 클라우드 지원

복잡하거나 큰 PDF는 [PageIndex Cloud](https://docs.pageindex.ai/)를 통해 추가 기능을 사용할 수 있습니다:

- 스캔된 PDF OCR 지원 (호스팅 VLM 모델)
- 빠른 구조 생성
- 대용량 문서 확장 인덱싱

`.env`에 `PAGEINDEX_API_KEY`를 설정하면 클라우드 기능이 활성화됩니다:

```
PAGEINDEX_API_KEY=your_pageindex_api_key
```

### AGENTS.md

`wiki/AGENTS.md` 파일은 위키 구조와 규칙을 정의합니다. LLM이 위키를 유지하는 데 사용하는 지침서입니다. 직접 편집해 위키 구성 방식을 변경할 수 있습니다.

런타임에 LLM이 디스크에서 `AGENTS.md`를 읽으므로 편집 내용이 즉시 반영됩니다.

### 웹 UI

OpenKB는 위키를 탐색하고 지식베이스와 채팅할 수 있는 React 기반 웹 뷰어를 제공합니다.

**백엔드 시작** (KB 디렉토리 안에서 실행하거나 `--kb-dir` 지정):

```bash
openkb serve
# 또는
openkb --kb-dir ./my-kb serve
```

**프론트엔드 시작** (별도 터미널에서):

```bash
cd web
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 웹 UI는 `http://127.0.0.1:9000` 백엔드에 연결됩니다.

### Obsidian과 함께 사용하기

OpenKB의 위키는 `[[위키링크]]`가 있는 Markdown 파일 디렉토리입니다. Obsidian이 기본적으로 렌더링합니다.

1. `wiki/`를 Obsidian vault로 열기
2. 요약, 개념, 탐색 결과 탐색
3. 그래프 뷰로 지식 연결 확인
4. Obsidian Web Clipper로 웹 기사를 `raw/`에 추가

### Claude Code / Codex / Gemini CLI와 함께 사용하기

OpenKB는 `SKILL.md`를 제공하므로 에이전트 CLI에서 컴파일된 위키를 읽을 수 있습니다.

**Claude Code:**

```
/plugin marketplace add VectifyAI/OpenKB
/plugin install openkb@vectify
```

**Gemini CLI:**

```bash
gemini skills install https://github.com/VectifyAI/OpenKB.git --path skills/openkb --consent
```

**OpenAI Codex CLI** (수동 심볼릭 링크):

```bash
git clone https://github.com/VectifyAI/OpenKB.git ~/openkb-src
mkdir -p ~/.agents/skills
ln -s ~/openkb-src/skills/openkb ~/.agents/skills/openkb
```

# 🧭 더 알아보기

### Karpathy 접근법과의 비교

| | Karpathy 워크플로 | OpenKB |
|---|---|---|
| 짧은 문서 | LLM이 직접 읽기 | markitdown → LLM 읽기 |
| 긴 문서 | 컨텍스트 한계, 컨텍스트 손실 | PageIndex 트리 인덱스 |
| 지원 형식 | 웹 클리퍼 → .md | PDF, Word, PPT, Excel, HTML, 텍스트, CSV, .md |
| 위키 컴파일 | LLM 에이전트 | LLM 에이전트 (동일) |
| Q&A | 위키 질의 | 위키 + PageIndex 검색 |

### 기술 스택

- [PageIndex](https://github.com/VectifyAI/PageIndex) — 벡터 없는 추론 기반 문서 인덱싱 및 검색
- [markitdown](https://github.com/microsoft/markitdown) — 범용 파일 → Markdown 변환
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python) — 에이전트 프레임워크 (LiteLLM으로 비OpenAI 모델 지원)
- [LiteLLM](https://github.com/BerriAI/litellm) — 멀티 프로바이더 LLM 게이트웨이
- [Click](https://click.palletsprojects.com/) — CLI 프레임워크
- [watchdog](https://github.com/gorakhargosh/watchdog) — 파일시스템 모니터링
- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) — 웹 API 서버

### 로드맵

- [ ] PDF 이외 형식의 긴 문서 처리 확장
- [ ] 중첩 폴더 지원으로 대규모 문서 컬렉션 확장
- [ ] 대규모 지식베이스를 위한 계층적 개념 인덱싱
- [ ] 데이터베이스 기반 스토리지 엔진

### 기여하기

기여를 환영합니다! 버그나 기능 요청은 [이슈](https://github.com/VectifyAI/OpenKB/issues)를 열어주세요. 큰 변경사항은 먼저 이슈를 열어 논의해 주세요.

### 라이선스

Apache 2.0. [LICENSE](LICENSE) 참고.

### 응원하기

OpenKB가 유용하다면 별표 🌟를 눌러주세요 — [PageIndex](https://github.com/VectifyAI/PageIndex)도 확인해보세요!

<div>

[![Twitter](https://img.shields.io/badge/Twitter-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/PageIndexAI)&ensp;
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/company/vectify-ai/)&ensp;
[![Contact Us](https://img.shields.io/badge/Contact_Us-3B82F6?style=for-the-badge&logo=envelope&logoColor=white)](https://ii2abc2jejf.typeform.com/to/tK3AXl8T)

</div>
