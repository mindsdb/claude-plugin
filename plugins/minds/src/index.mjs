#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.MINDS_BASE_URL || "https://mdb.ai";
const API_KEY = process.env.MINDS_API_KEY || "";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204 || text.length === 0) return null;
  return JSON.parse(text);
}

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(e) {
  return {
    content: [{ type: "text", text: `Error: ${e.message}` }],
    isError: true,
  };
}

// ── Server ─────────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "minds",
  version: "1.0.0",
});

// ── Datasources ────────────────────────────────────────────────────────────────

server.tool(
  "list_datasources",
  "List all datasources in your Minds account",
  {},
  async () => {
    try {
      return ok(await api("GET", "/api/v1/datasources"));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_datasource",
  "Get details of a datasource, optionally checking its connection status",
  {
    name: z.string().describe("Datasource name"),
    check_connection: z
      .boolean()
      .optional()
      .describe("Verify the connection is alive"),
  },
  async ({ name, check_connection }) => {
    try {
      const qs = check_connection ? "?check_connection=true" : "";
      return ok(await api("GET", `/api/v1/datasources/${name}${qs}`));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_datasource",
  "Create a new datasource connection (postgres, mysql, snowflake, bigquery, mongodb, s3, redshift, clickhouse, etc.)",
  {
    name: z.string().describe("Unique datasource name"),
    engine: z
      .string()
      .describe(
        "Database engine: postgres, mysql, mariadb, mssql, mongodb, snowflake, bigquery, redshift, databricks, clickhouse, s3, dynamodb, elasticsearch, one_drive, teradata"
      ),
    description: z
      .string()
      .optional()
      .describe("Human-readable description of the data"),
    connection_data: z
      .record(z.any())
      .describe(
        "Connection parameters (host, port, user, password, database, schema, etc.)"
      ),
    tables: z
      .array(z.string())
      .optional()
      .describe("Restrict access to specific tables"),
  },
  async ({ name, engine, description, connection_data, tables }) => {
    try {
      const body = { name, engine, connection_data };
      if (description) body.description = description;
      if (tables) body.tables = tables;
      return ok(await api("POST", "/api/v1/datasources", body));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_datasource",
  "Update a datasource's description, connection parameters, or tables",
  {
    name: z.string().describe("Datasource name to update"),
    description: z.string().optional().describe("New description"),
    connection_data: z
      .record(z.any())
      .optional()
      .describe("Updated connection parameters"),
    tables: z.array(z.string()).optional().describe("Updated table list"),
  },
  async ({ name, description, connection_data, tables }) => {
    try {
      const body = {};
      if (description !== undefined) body.description = description;
      if (connection_data) body.connection_data = connection_data;
      if (tables) body.tables = tables;
      return ok(await api("PATCH", `/api/v1/datasources/${name}`, body));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_datasource",
  "Delete a datasource",
  {
    name: z.string().describe("Datasource name to delete"),
  },
  async ({ name }) => {
    try {
      await api("DELETE", `/api/v1/datasources/${name}`);
      return ok({ deleted: true, name });
    } catch (e) {
      return err(e);
    }
  }
);

// ── Minds ──────────────────────────────────────────────────────────────────────

server.tool(
  "list_minds",
  "List all Minds in your account",
  {},
  async () => {
    try {
      return ok(await api("GET", "/api/v1/minds"));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_mind",
  "Get details of a specific Mind",
  {
    name: z.string().describe("Mind name"),
  },
  async ({ name }) => {
    try {
      return ok(await api("GET", `/api/v1/minds/${name}`));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_mind",
  "Create a new Mind connected to one or more datasources",
  {
    name: z.string().describe("Unique Mind name"),
    datasources: z
      .array(
        z.union([
          z.string(),
          z.object({
            name: z.string(),
            tables: z.array(z.string()).optional(),
          }),
        ])
      )
      .describe("Datasources to attach — string names or {name, tables} objects"),
    system_prompt: z
      .string()
      .optional()
      .describe("Custom system prompt for the Mind"),
    allow_direct_queries: z
      .boolean()
      .optional()
      .describe("Allow direct SQL queries through this Mind"),
  },
  async ({ name, datasources, system_prompt, allow_direct_queries }) => {
    try {
      const body = { name, datasources };
      const params = {};
      if (system_prompt) params.system_prompt = system_prompt;
      if (allow_direct_queries !== undefined)
        params.allow_direct_queries = allow_direct_queries;
      if (Object.keys(params).length > 0) body.parameters = params;
      return ok(await api("POST", "/api/v1/minds", body));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_mind",
  "Update a Mind's name, datasources, or parameters",
  {
    name: z.string().describe("Mind name to update"),
    new_name: z.string().optional().describe("Rename the Mind"),
    datasources: z
      .array(
        z.union([
          z.string(),
          z.object({
            name: z.string(),
            tables: z.array(z.string()).optional(),
          }),
        ])
      )
      .optional()
      .describe("Updated datasource list"),
    system_prompt: z.string().optional().describe("Updated system prompt"),
    allow_direct_queries: z.boolean().optional(),
  },
  async ({ name, new_name, datasources, system_prompt, allow_direct_queries }) => {
    try {
      const body = {};
      if (new_name) body.name = new_name;
      if (datasources) body.datasources = datasources;
      const params = {};
      if (system_prompt) params.system_prompt = system_prompt;
      if (allow_direct_queries !== undefined)
        params.allow_direct_queries = allow_direct_queries;
      if (Object.keys(params).length > 0) body.parameters = params;
      return ok(await api("PUT", `/api/v1/minds/${name}`, body));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_mind",
  "Delete a Mind",
  {
    name: z.string().describe("Mind name to delete"),
  },
  async ({ name }) => {
    try {
      await api("DELETE", `/api/v1/minds/${name}`);
      return ok({ deleted: true, name });
    } catch (e) {
      return err(e);
    }
  }
);

// ── Chat / Query ───────────────────────────────────────────────────────────────

server.tool(
  "ask_mind",
  "Ask a question to a Mind using the Chat Completions API (OpenAI-compatible). Returns a natural-language answer based on connected data.",
  {
    mind: z.string().describe("Mind name to query"),
    question: z.string().describe("Natural language question"),
    history: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })
      )
      .optional()
      .describe("Previous messages for multi-turn conversation"),
  },
  async ({ mind, question, history }) => {
    try {
      const messages = [...(history || []), { role: "user", content: question }];
      const data = await api("POST", "/api/v1/chat/completions", {
        model: mind,
        messages,
        stream: false,
      });
      const answer = data.choices?.[0]?.message?.content || JSON.stringify(data);
      return { content: [{ type: "text", text: answer }] };
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "query_mind",
  "Query a Mind using the Responses API, with optional SQL query tool and conversation context",
  {
    mind: z.string().describe("Mind name"),
    question: z.string().describe("Natural language question or instruction"),
    conversation_id: z
      .string()
      .optional()
      .describe("Conversation ID to continue a previous thread"),
    sql_query: z
      .string()
      .optional()
      .describe(
        "Direct SQL SELECT query to run (Mind must have allow_direct_queries enabled)"
      ),
    max_inline_rows: z
      .number()
      .optional()
      .describe("Max rows to return inline (1-10000, default 10000)"),
  },
  async ({ mind, question, conversation_id, sql_query, max_inline_rows }) => {
    try {
      const body = { model: mind, input: question, stream: false };
      if (conversation_id) body.conversation = conversation_id;
      if (sql_query) {
        body.tools = [
          {
            type: "sql_query",
            query: sql_query,
            ...(max_inline_rows !== undefined && { max_inline_rows }),
          },
        ];
      }
      return ok(await api("POST", "/api/v1/responses", body));
    } catch (e) {
      return err(e);
    }
  }
);

// ── Query Results ──────────────────────────────────────────────────────────────

server.tool(
  "get_query_result",
  "Get paginated results from a previous query (by conversation and message ID)",
  {
    conversation_id: z.string().describe("Conversation UUID"),
    message_id: z.string().describe("Message UUID"),
    limit: z.number().optional().describe("Max rows (1-1000, default 100)"),
    offset: z.number().optional().describe("Rows to skip (default 0)"),
  },
  async ({ conversation_id, message_id, limit, offset }) => {
    try {
      const params = new URLSearchParams();
      if (limit !== undefined) params.set("limit", String(limit));
      if (offset !== undefined) params.set("offset", String(offset));
      const qs = params.toString() ? `?${params}` : "";
      return ok(
        await api(
          "GET",
          `/api/v1/conversations/${conversation_id}/items/${message_id}/result${qs}`
        )
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "export_query_csv",
  "Export query results as CSV",
  {
    conversation_id: z.string().describe("Conversation UUID"),
    message_id: z.string().describe("Message UUID"),
  },
  async ({ conversation_id, message_id }) => {
    try {
      const url = `${BASE_URL}/api/v1/conversations/${conversation_id}/items/${message_id}/export`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const csv = await res.text();
      return { content: [{ type: "text", text: csv }] };
    } catch (e) {
      return err(e);
    }
  }
);

// ── Data Catalog ───────────────────────────────────────────────────────────────

server.tool(
  "get_catalog",
  "Get the data catalog for a datasource — tables, columns, types, and statistics",
  {
    datasource: z.string().describe("Datasource name"),
    mind: z
      .string()
      .optional()
      .describe("Filter to tables used by a specific Mind"),
  },
  async ({ datasource, mind }) => {
    try {
      const qs = mind ? `?mind=${encodeURIComponent(mind)}` : "";
      return ok(
        await api("GET", `/api/v1/datasources/${datasource}/catalog${qs}`)
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "refresh_catalog",
  "Refresh the data catalog for a datasource",
  {
    datasource: z.string().describe("Datasource name"),
    mode: z
      .enum(["missing_only", "all", "force"])
      .describe(
        "missing_only = only uncataloged tables, all = re-catalog existing, force = full rebuild"
      ),
    table_names: z
      .array(z.string())
      .optional()
      .describe("Specific tables to refresh (omit for all)"),
  },
  async ({ datasource, mode, table_names }) => {
    try {
      const body = { mode };
      if (table_names) body.table_names = table_names;
      return ok(
        await api(
          "POST",
          `/api/v1/datasources/${datasource}/catalog/refresh`,
          body
        )
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "load_catalog_tables",
  "Load specific tables into the data catalog",
  {
    datasource: z.string().describe("Datasource name"),
    table_names: z.array(z.string()).describe("Tables to load"),
  },
  async ({ datasource, table_names }) => {
    try {
      return ok(
        await api(
          "POST",
          `/api/v1/datasources/${datasource}/catalog/tables`,
          { table_names }
        )
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_table_description",
  "Update the description of a table in the data catalog",
  {
    datasource: z.string().describe("Datasource name"),
    table: z.string().describe("Table name"),
    description: z.string().describe("New description"),
  },
  async ({ datasource, table, description }) => {
    try {
      return ok(
        await api(
          "PATCH",
          `/api/v1/datasources/${datasource}/catalog/tables/${table}`,
          { description }
        )
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_column_description",
  "Update the description of a column in the data catalog",
  {
    datasource: z.string().describe("Datasource name"),
    table: z.string().describe("Table name"),
    column: z.string().describe("Column name"),
    description: z.string().describe("New description"),
  },
  async ({ datasource, table, column, description }) => {
    try {
      return ok(
        await api(
          "PATCH",
          `/api/v1/datasources/${datasource}/catalog/tables/${table}/columns/${column}`,
          { description }
        )
      );
    } catch (e) {
      return err(e);
    }
  }
);

// ── Start ──────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
