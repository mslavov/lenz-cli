# lenz-cli

CLI + Claude Code skill for the [Lenz](https://lenz.io) verified claims fact-checking platform.

Search a library of verified claims, submit new claims for verification, explore detailed reports with sources, expert assessments, and debates — from the terminal or as an AI agent skill.

## Install as Agent Skill

```bash
claude install mslavov/lenz-cli
```

## Install as CLI

```bash
npm install -g lenz-cli
```

Or use directly with `npx`:

```bash
npx lenz-cli search "climate change"
```

## Setup

Get your API token from [lenz.io](https://lenz.io) (Account > API Integration), then:

```bash
lenz config <your-token>
```

Or set the `LENZ_TOKEN` environment variable:

```bash
export LENZ_TOKEN=lenz_...
```

Public commands (`search`, `get`, `domains`, `podcasts`, `browse`) work without a token.

## Usage

### Search verified claims

```bash
lenz search "vaccine safety"
lenz search "AI" --domain Tech --sort popular --json
```

### Get a full verification report

```bash
lenz get <claim_id>
lenz get <claim_id> --json
```

Returns the complete report: verdict, score, sources, pro/con debate, panel assessments, and consensus.

### Browse claims

```bash
lenz browse --domain Health --sort recent
lenz browse --entity "OpenAI" --json
```

### List domains

```bash
lenz domains
```

### List podcast episodes

```bash
lenz podcasts
```

### Submit a claim for verification

```bash
lenz submit "The Great Wall of China is visible from space"
lenz submit "Electric cars pollute more" --source-url "https://example.com/article"
```

### Check submission status

```bash
lenz status <task_id>
```

### Chat with AI expert about a claim

```bash
lenz ask <claim_id> "What are the weaknesses in the sources?"
lenz chat <claim_id>          # view chat history
lenz reset-chat <claim_id>   # clear chat history
```

### Manage your claims

```bash
lenz my-claims
lenz my-claim <claim_id>
lenz delete <claim_id>
lenz visibility <claim_id> public
```

## Global Options

| Flag | Description |
|------|-------------|
| `--token <token>` | Auth token (or set `LENZ_TOKEN` env var) |
| `--json` | Output raw JSON |

## License

MIT
