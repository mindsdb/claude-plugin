# Minds Plugin for Claude Code

**Connect any database. Create an AI Mind. Ask questions in plain English.**

This is a [Claude Code plugin marketplace](https://docs.anthropic.com) that gives Claude direct access to your data through [Minds](https://mdb.ai) — no context-switching, no copy-pasting query results, no leaving your terminal.

```
/plugin marketplace add jorgestorres/claude-plugin
/plugin install minds@minds-marketplace
```

That's it. Claude can now connect your databases, build Minds, and query your data.

---

## What You Can Do

**"Connect my Postgres database and tell me which customers churned last month."**

Claude will create the datasource, build a Mind, and answer the question — all in one conversation.

### Connect Data

Claude connects directly to your databases:

| Engine | | Engine | | Engine |
|--------|-|--------|-|--------|
| PostgreSQL | | MySQL | | MongoDB |
| Snowflake | | BigQuery | | Redshift |
| Databricks | | ClickHouse | | SQL Server |
| MariaDB | | Elasticsearch | | DynamoDB |
| Amazon S3 | | OneDrive | | Teradata |

### Create Minds

A Mind is an AI that understands your data. Claude creates them with the right system prompt, connects the right tables, and configures direct SQL access when needed.

### Ask Questions

```
You:    "What were our top 10 products by revenue last quarter?"
Claude: [calls ask_mind] → returns the answer with data
You:    "Export that as CSV"
Claude: [calls export_query_csv] → gives you the file
```

---

## Quick Start

### 1. Get your API key

Sign up at [mdb.ai](https://mdb.ai) and grab your API key from the [API Keys tab](https://mdb.ai/apiKeys).

### 2. Set your environment variable

```bash
export MINDS_API_KEY=your_key_here
```

### 3. Install the plugin

```
/plugin marketplace add jorgestorres/claude-plugin
/plugin install minds@minds-marketplace
```

### 4. Start talking to your data

```
You: Connect to my postgres database at db.example.com, database "analytics", user "readonly"
You: Create a Mind called "sales-analyst" that can answer questions about our sales data
You: What's the average order value by region for the last 6 months?
```

---

## 19 Tools

Everything is pure REST — no SDK, no dependencies beyond the MCP server itself.

### Datasources

| Tool | What it does |
|------|-------------|
| `list_datasources` | List all connected datasources |
| `get_datasource` | Get details + optionally verify connection is alive |
| `create_datasource` | Connect a new database (any of the 15 supported engines) |
| `update_datasource` | Update connection params, description, or table access |
| `delete_datasource` | Remove a datasource |

### Minds

| Tool | What it does |
|------|-------------|
| `list_minds` | List all Minds |
| `get_mind` | Get a Mind's config, datasources, and parameters |
| `create_mind` | Create a new Mind with datasources and system prompt |
| `update_mind` | Update a Mind's name, datasources, or prompt |
| `delete_mind` | Delete a Mind |

### Query

| Tool | What it does |
|------|-------------|
| `ask_mind` | Ask a natural language question (Chat Completions API) |
| `query_mind` | Query with conversation context + optional direct SQL (Responses API) |

### Results

| Tool | What it does |
|------|-------------|
| `get_query_result` | Paginated results from a previous query |
| `export_query_csv` | Export full results as CSV |

### Data Catalog

| Tool | What it does |
|------|-------------|
| `get_catalog` | Browse tables, columns, types, and statistics |
| `refresh_catalog` | Re-index the schema (missing_only, all, or force) |
| `load_catalog_tables` | Pull specific tables into the catalog |
| `update_table_description` | Annotate a table so the Mind understands it better |
| `update_column_description` | Annotate a column for better query accuracy |

---

## Slash Commands

The plugin includes three commands for common workflows:

| Command | Description |
|---------|-------------|
| `/minds:connect` | Guided flow to connect a new database |
| `/minds:ask` | Pick a Mind and ask it a question |
| `/minds:explore` | Browse your data catalog — tables, columns, stats |

---

## How It Works

```
┌─────────────┐     stdio      ┌─────────────┐    REST     ┌─────────────┐
│             │ ◄────────────► │             │ ──────────► │             │
│ Claude Code │                │  MCP Server │             │  Minds API  │
│             │   19 tools     │  (Node.js)  │  Bearer     │  mdb.ai     │
└─────────────┘                └─────────────┘  token      └──────┬──────┘
                                                                  │
                                                           ┌──────▼──────┐
                                                           │ Your Data   │
                                                           │ ┌─────────┐ │
                                                           │ │Postgres │ │
                                                           │ │Snowflake│ │
                                                           │ │BigQuery │ │
                                                           │ │ ...     │ │
                                                           │ └─────────┘ │
                                                           └─────────────┘
```

The MCP server is a thin REST wrapper. Every tool maps to a Minds API endpoint. No data is cached, no state is stored — queries go straight to your databases through Minds.

---

## Project Structure

```
├── .claude-plugin/
│   └── marketplace.json          # Marketplace catalog
└── plugins/
    └── minds/
        ├── .claude-plugin/
        │   └── plugin.json       # Plugin manifest
        ├── .mcp.json             # MCP server config
        ├── package.json
        ├── src/
        │   └── index.mjs         # MCP server — 19 tools, pure fetch
        ├── skills/
        │   └── minds-data/
        │       └── SKILL.md      # Auto-invoked skill for data workflows
        └── commands/
            ├── connect.md        # /minds:connect
            ├── ask.md            # /minds:ask
            └── explore.md        # /minds:explore
```

---

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `MINDS_API_KEY` | *(required)* | Your Minds API key from [mdb.ai/apiKeys](https://mdb.ai/apiKeys) |
| `MINDS_BASE_URL` | `https://mdb.ai` | Custom API base URL (for self-hosted deployments) |

---

## For Teams

Add this marketplace to your project's `.claude/settings.json` so every team member gets it automatically:

```json
{
  "extraKnownMarketplaces": {
    "minds-marketplace": {
      "source": {
        "source": "github",
        "repo": "jorgestorres/claude-plugin"
      }
    }
  },
  "enabledPlugins": {
    "minds@minds-marketplace": true
  }
}
```

---

## Contributing

Add a new plugin to the marketplace:

1. Create your plugin in `plugins/<your-plugin>/`
2. Add a `.claude-plugin/plugin.json` manifest
3. Register it in `.claude-plugin/marketplace.json`
4. Open a PR

---

## License

MIT
