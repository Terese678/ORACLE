# ORACLE

### The AI agent that lives your day before you live it. Your mental crack into tomorrow.

> Won **Most Creative** at the Backboard.io Spring 2026 Hackathon

**[Try ORACLE live](https://oracle-six-snowy.vercel.app)**

---

## What is ORACLE?

Most wellness apps react to how you are feeling. ORACLE does not react. It intercepts.

ORACLE is a personal AI guardian that runs a daily three-part mental performance loop. It sees the risk in your day before you do, cross-references what you say against what your face reveals, and tracks you from morning through evening to close the loop.

## How It Works

**Morning Scan**
Five sharp questions covering your schedule, sleep quality, main uncertainty for the day, energy reading, and physical state. Not generic wellness questions. Five data points that together surface the hidden risk in your day. After the questions, ORACLE reads your face against your answers.

**Face Reading**
ORACLE captures a photo and cross-references it against everything you just said. If your answers say energy is high but your face shows dark circles and tension, ORACLE names that gap directly. The gap between self-reported state and physical reality is where days break down. ORACLE closes it.

**Mid-Day Check-In**
Three hours after your morning scan, ORACLE checks in with one sharp question about how the day is going relative to the morning prediction. Not therapy. A status check.

**Evening Debrief**
At the end of the day, ORACLE closes the loop. It references the prediction it made in the morning and asks whether it came true. Every day it gets more accurate because of the night before.

## Built On

ORACLE is built entirely on the Backboard API.

**Thread Memory** — The morning scan, mid-day check-in, and evening debrief share the same thread ID. ORACLE remembers your full day across three separate sessions automatically. No custom memory system needed.

**Model Routing** — The morning scan uses GPT-4o-mini. The face reading routes to GPT-4o with vision capability. Backboard handles the routing with one API key.

**TTS Voice** — The morning briefing is read aloud using Backboard's TTS API routed through OpenAI's onyx voice model. Deep, authoritative, deliberate.

## Tech Stack

- React, Vite
- Backboard API, thread memory, model routing, multimodal vision, TTS
- GPT-4o vision for face reading
- Deployed on Vercel

## Try It

[oracle-six-snowy.vercel.app](https://oracle-six-snowy.vercel.app)

Open the app each morning. Answer the five questions. Let ORACLE see you.

## Who It Is For

Founders, developers, creatives, students. Anyone whose mental performance directly affects their output and wants something that tells them the truth, not just what they want to hear.

---

Built in Nigeria. Won Most Creative.