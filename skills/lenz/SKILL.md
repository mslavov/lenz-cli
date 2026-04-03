---
name: lenz
description: Search, browse, and verify claims using the Lenz fact-checking platform. Use when the user asks about fact-checking, claim verification, misinformation, verifying a statement's truthfulness, or wants to check if something is true or false.
allowed-tools: Bash(lenz *) Bash(npx lenz-cli *)
---

# Lenz Fact-Checking Assistant

You have access to the Lenz verified claims platform — a comprehensive fact-checking system that researches claims, gathers sources, runs structured debates, and produces scored verification reports.

## Setup

The `LENZ_TOKEN` environment variable must be set for authenticated commands (submit, chat, etc.). Public commands (search, get, browse, domains, podcasts) work without a token. Users can get a token at [lenz.io](https://lenz.io) under Account > API Integration.

## CLI Commands

Use the `lenz` CLI (or `npx lenz-cli` if not installed globally). Always add `--json` when you need to parse the output programmatically.

### search — Search published verified claims

```bash
lenz search "climate change" --json
lenz search "vaccine safety" --domain Health --sort relevance --json
```

- First argument: search query
- `--domain`: filter by domain (use `lenz domains` to see options)
- `--sort`: recent, popular, most_true, most_untrue, relevance (default: relevance)
- `--page`: page number (default: 1)

### get — Full verification report for a claim

```bash
lenz get "claim_abc123" --json
```

Returns the complete report: conclusion, score, sources, debate (pro/con), panel assessments, consensus, and annotations.

### browse — Browse claims with filters

```bash
lenz browse --domain "Technology" --sort recent --json
lenz browse --entity "OpenAI" --json
```

- `--domain`: filter by domain
- `--entity`: filter by entity
- `--sort`: recent, popular, most_true, most_untrue
- `--page`: page number

### domains — List available domains

```bash
lenz domains --json
```

Returns domains with at least 5 published claims. Use these to filter searches.

### podcasts — List podcast episodes

```bash
lenz podcasts --json
```

Each podcast covers a verified claim with an AI-generated audio discussion.

### submit — Submit a claim for verification (auth required)

```bash
lenz submit "The Earth is flat" --json
```

- `--source-url`: URL where the claim was found
- `--visibility`: visibility setting

### status — Check submission status (auth required)

```bash
lenz status "task_abc123" --json
```

### ask — Chat with AI expert about a claim (auth required)

```bash
lenz ask "claim_abc123" "What are the main weaknesses in the sources?" --json
```

### chat — View chat history (auth required)

```bash
lenz chat "claim_abc123" --json
```

### my-claims — List your submitted claims (auth required)

```bash
lenz my-claims --json
```

### my-claim — Get detail of your own claim (auth required)

```bash
lenz my-claim "claim_abc123" --json
```

## Fact-Checking Workflow

### When the user asks "Is X true?"

1. **Search** for existing verified claims: `lenz search "X" --json`
2. If found, **get the full report**: `lenz get <claim_id> --json`
3. **Synthesize** the findings — report the verdict, score, key sources, and any caveats
4. If not found and the user wants it checked, **submit** the claim: `lenz submit "X" --json`
5. **Poll status** until complete: `lenz status <task_id> --json`

### When browsing by topic

1. List domains: `lenz domains --json`
2. Browse with filters: `lenz browse --domain "Health" --sort popular --json`
3. Get details on interesting claims: `lenz get <claim_id> --json`

### When the user wants deeper analysis

1. Get the full report: `lenz get <claim_id> --json`
2. Ask the AI expert follow-up questions: `lenz ask <claim_id> "question" --json`
3. Synthesize the report data and expert answers

## Interpreting Results

### Lenz Score (0-100)
- **80-100**: Strong evidence supports the claim
- **60-79**: Mostly supported with some caveats
- **40-59**: Mixed evidence, significant nuance needed
- **20-39**: Mostly unsupported
- **0-19**: Strong evidence contradicts the claim

### Conclusion Labels
Common labels: True, Mostly True, Mixed, Misleading, Mostly Untrue, Untrue

### Key Report Sections
- **Executive Summary**: Quick overview of the verdict
- **Sources**: Research sources with stance (supporting/opposing/neutral)
- **Debate**: Structured pro/con arguments with rebuttals
- **Assessments**: Individual panelist scores and reasoning
- **Consensus**: Overall confidence, unanimity, and score spread

## Response Guidelines

- Always cite the Lenz score and conclusion label
- Quote relevant parts of the executive summary
- Mention key sources that support the verdict
- Flag low-confidence or time-dependent claims
- Note any warnings from the report
- If the claim hasn't been verified yet, offer to submit it
