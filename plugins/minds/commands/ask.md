---
description: Ask a question to one of your Minds
---

Help the user ask a question to one of their Minds.

1. First, use `list_minds` to show available Minds.
2. If the user hasn't specified which Mind, ask them to pick one.
3. Use `ask_mind` with their natural language question.
4. Present the answer clearly. If the response references data, offer to run `query_mind` with SQL for exact numbers, or `export_query_csv` for a full export.
