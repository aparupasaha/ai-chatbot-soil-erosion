"""Soil-erosion control chatbot: Markdown knowledge base + TF-IDF retrieval + Groq LLM."""
import json
import os
import re
from pathlib import Path

import truststore
from flask import Flask, Response, jsonify, request, stream_with_context

# Use the Windows certificate store so HTTPS works behind antivirus/proxy TLS inspection.
truststore.inject_into_ssl()
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROOT = Path(__file__).parent
ENV_FILE = ROOT / ".env"
if ENV_FILE.exists():  # minimal .env loader: KEY=value lines; real environment variables win
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        key, sep, val = line.partition("=")
        if sep and not line.lstrip().startswith("#"):
            os.environ.setdefault(key.strip(), val.strip().strip('"'))

KB_DIR = ROOT / "knowledge_base"
# Cheapest Groq production model (docs: $0.075 in / $0.30 out per 1M tokens). Override via GROQ_MODEL.
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
TOP_K = 4
MIN_SCORE = 0.05  # below this, the question is treated as outside the knowledge base


def load_chunks():
    """Each '## ' section of each Markdown file becomes one retrievable chunk."""
    chunks = []
    for f in sorted(KB_DIR.glob("*.md")):
        text = f.read_text(encoding="utf-8")
        category = text.splitlines()[0].lstrip("# ").strip()
        for sec in re.split(r"^## ", text, flags=re.M)[1:]:
            title, _, body = sec.partition("\n")
            chunks.append({"title": title.strip(), "category": category, "body": body.strip()})
    return chunks


CHUNKS = load_chunks()
# Two TF-IDF indexes: section titles (so "Explain mulching" lands on "Mulching") and full text.
BODY_VEC = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
BODY_M = BODY_VEC.fit_transform(f"{c['title']} {c['body']}" for c in CHUNKS)
GENERIC = ["soil", "erosion", "control", "controlling", "reduce", "reduces", "role", "used", "explain"]
TITLE_VEC = TfidfVectorizer(stop_words=list(ENGLISH_STOP_WORDS) + GENERIC, sublinear_tf=True)
TITLE_M = TITLE_VEC.fit_transform(c["title"] for c in CHUNKS)
IS_COMPARISON = [" vs " in c["title"] or "difference" in c["title"].lower() for c in CHUNKS]
COMPARE_WORDS = re.compile(r"\b(vs|versus|differ\w*|compar\w*|better)\b", re.I)


def retrieve(question, k=TOP_K):
    scores = (cosine_similarity(BODY_VEC.transform([question]), BODY_M)[0]
              + cosine_similarity(TITLE_VEC.transform([question]), TITLE_M)[0]) / 2
    if not COMPARE_WORDS.search(question):  # comparison sections only lead for comparison questions
        scores = [s * 0.5 if cmp else s for s, cmp in zip(scores, IS_COMPARISON)]
    ranked = sorted(range(len(CHUNKS)), key=lambda i: -scores[i])[:k]
    return [(CHUNKS[i], float(scores[i])) for i in ranked if scores[i] >= MIN_SCORE]


SYSTEM = """You are a soil-conservation assistant for a college project on soil-erosion control.
Answer ONLY from the knowledge-base excerpts provided. If they do not contain the answer, say that the
topic is not covered in the knowledge base. Do not invent figures or facts.
Write clear, well-structured answers for students in Markdown: a short intro sentence, then '-' bullet
points (definition, how it works, how it reduces erosion, where suitable, advantages, limitations as
relevant). Use **bold** for key terms. For comparisons you may use short '### ' subheadings.
When comparing techniques, explain the differences and when each fits; never call one universally best.
Use earlier conversation turns only to understand follow-up questions."""

NOT_COVERED = "This question is not covered by the soil-erosion knowledge base. Try asking about a soil-conservation technique, e.g. *contour farming*, *terracing* or *windbreaks*."
FOLLOWUP_SCORE = 0.15  # weaker top match than this + earlier turns => treat as a follow-up question
HISTORY_TURNS, HISTORY_CHARS = 4, 800  # small, to stay inside Groq's free-tier tokens/minute


def clean_history(raw):
    """Keep only the last few well-formed user/assistant messages, truncated."""
    msgs = [m for m in raw if isinstance(m, dict) and m.get("role") in ("user", "assistant")
            and isinstance(m.get("content"), str)] if isinstance(raw, list) else []
    return [{"role": m["role"], "content": m["content"][:HISTORY_CHARS]} for m in msgs[-HISTORY_TURNS:]]


def chat_events(question, history):
    """Yields NDJSON-able events: sources, notice, delta (answer text), error, done."""
    hits = retrieve(question)
    prev = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
    if prev and (not hits or hits[0][1] < FOLLOWUP_SCORE):  # e.g. "what are its limitations?"
        hits = retrieve(f"{prev} {question}") or hits
    if not hits:
        yield {"type": "delta", "text": NOT_COVERED}
        yield {"type": "done"}
        return
    yield {"type": "sources", "sources": [c["title"] for c, _ in hits]}
    context = "\n\n".join(f"[{c['category']} > {c['title']}]\n{c['body']}" for c, _ in hits)
    best = hits[0][0]
    fallback = f"### {best['title']}\n\n{best['body']}"  # best-matching knowledge-base section as-is
    if not os.environ.get("GROQ_API_KEY"):
        yield {"type": "delta", "text": fallback}
        yield {"type": "done"}
        return
    from groq import Groq

    sent = False
    try:
        stream = Groq().chat.completions.create(  # reads GROQ_API_KEY from the environment
            model=MODEL,
            messages=[{"role": "system", "content": SYSTEM}, *history,
                      {"role": "user", "content": f"Knowledge-base excerpts:\n\n{context}\n\nQuestion: {question}"}],
            temperature=0.3,
            max_completion_tokens=1500,  # includes the model's (low-effort) reasoning tokens
            reasoning_effort="low",
            include_reasoning=False,
            stream=True,
        )
        for chunk in stream:
            text = chunk.choices[0].delta.content if chunk.choices else None
            if text:
                sent = True
                yield {"type": "delta", "text": text}
    except Exception as e:  # rate limit (free tier: 8K tokens/min), network, etc.
        print(f"Groq error: {e}")
        if sent:
            yield {"type": "error", "message": "The answer was interrupted. Please try again."}
        else:
            yield {"type": "notice", "text": "Live AI is busy right now, so here is the matching knowledge-base section."}
            yield {"type": "delta", "text": fallback}
    yield {"type": "done"}


app = Flask(__name__, static_folder="static", static_url_path="/static")


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/api/status")
def status():
    return jsonify(live=bool(os.environ.get("GROQ_API_KEY")), model=MODEL, sections=len(CHUNKS))


@app.post("/api/chat")
def chat():
    body = request.get_json(silent=True) or {}
    q = str(body.get("question", "")).strip()[:500]
    if not q:
        return jsonify(error="Please type a question."), 400
    history = clean_history(body.get("history"))
    lines = (json.dumps(ev) + "\n" for ev in chat_events(q, history))
    return Response(stream_with_context(lines), mimetype="application/x-ndjson",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


if __name__ == "__main__":
    app.run(debug=False, port=int(os.environ.get("PORT", 5050)), threaded=True)
