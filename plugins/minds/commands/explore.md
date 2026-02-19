---
description: Explore the schema and data catalog of your connected datasources
---

Help the user explore their data.

1. Use `list_datasources` to show all connected sources.
2. For the chosen datasource, use `get_catalog` to show tables, columns, types, and statistics.
3. If the catalog is empty or stale, offer to run `refresh_catalog` with mode `all`.
4. Suggest adding descriptions to tables and columns using `update_table_description` and `update_column_description` to improve Mind accuracy.
5. Summarize the schema in a clear table format for the user.
