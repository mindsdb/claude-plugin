---
description: Connect a new data source to Minds
---

Help the user connect a new data source to Minds. Ask them for:

1. **Engine type** — which database? (postgres, mysql, snowflake, bigquery, mongodb, redshift, s3, etc.)
2. **Connection details** — host, port, user, password, database, schema
3. **Description** — what does this data contain?
4. **Tables** — should we restrict to specific tables, or allow all?

Then use the `create_datasource` tool to create it. After creation, use `get_datasource` with `check_connection: true` to verify it works. If it succeeds, use `refresh_catalog` to index the schema.
