import chalk from "chalk";
import type {
  ClaimListItem,
  ClaimListResult,
  ClaimDetail,
  DomainsResult,
  PodcastEpisode,
  PodcastListResult,
  Source,
  Assessment,
} from "./client.js";

// --- Score / conclusion colors ---

function scoreColor(score: number | null): (s: string) => string {
  if (score === null) return chalk.gray;
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex("#FFA500");
  return chalk.red;
}

function conclusionColor(label: string): (s: string) => string {
  const l = label.toLowerCase();
  if (l.includes("true") && !l.includes("untrue") && !l.includes("not true")) return chalk.green;
  if (l.includes("mostly true")) return chalk.greenBright;
  if (l.includes("mixed") || l.includes("partially")) return chalk.yellow;
  if (l.includes("misleading")) return chalk.hex("#FFA500");
  if (l.includes("untrue") || l.includes("false") || l.includes("not true")) return chalk.red;
  return chalk.gray;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

// --- Claim list ---

function formatClaimItem(item: ClaimListItem, index: number): string {
  const lines: string[] = [];
  const num = chalk.dim(`${(index + 1).toString().padStart(3)}.`);
  const title = chalk.bold.white(truncate(item.claim, 90));
  const conclusion = conclusionColor(item.conclusion_label)(item.conclusion_label);
  const score =
    item.lenz_score !== null
      ? scoreColor(item.lenz_score)(`${item.lenz_score}/100`)
      : chalk.gray("n/a");
  const domain = chalk.cyan(item.domain);

  lines.push(`${num} ${title}`);
  lines.push(`     ${conclusion}  ${chalk.dim("Score:")} ${score}  ${domain}`);

  if (item.executive_summary) {
    lines.push(`     ${chalk.dim(truncate(item.executive_summary, 120))}`);
  }

  if (item.entities.length > 0) {
    lines.push(`     ${item.entities.map((e) => chalk.hex("#4682B4")(e)).join(", ")}`);
  }

  lines.push(`     ${chalk.dim(item.claim_id)}`);
  return lines.join("\n");
}

export function formatClaimsList(result: ClaimListResult): string {
  const lines: string[] = [];

  lines.push(
    chalk.bold(`\nLenz Library`) +
      chalk.dim(` \u2014 ${result.total} claims total\n`)
  );

  result.items.forEach((item, i) => {
    lines.push(formatClaimItem(item, (result.page - 1) * result.page_size + i));
    lines.push("");
  });

  const start = (result.page - 1) * result.page_size + 1;
  const end = start + result.items.length - 1;
  lines.push(chalk.dim(`Showing ${start}\u2013${end} of ${result.total}`));

  if (end < result.total) {
    lines.push(chalk.dim(`Use --page ${result.page + 1} to see more`));
  }

  return lines.join("\n");
}

// --- Claim detail ---

function formatSource(src: Source, i: number): string {
  const num = chalk.dim(`  ${(i + 1).toString().padStart(2)}.`);
  const stance = src.stance
    ? chalk.dim(`[${src.stance}]`)
    : "";
  const title = src.title || src.source_name || "Untitled";
  return `${num} ${chalk.white(title)} ${stance}\n      ${chalk.dim(src.url || "no url")}${src.snippet ? "\n      " + chalk.dim(truncate(src.snippet, 120)) : ""}`;
}

function formatAssessment(a: Assessment): string {
  const lines: string[] = [];
  const score = a.score !== null ? scoreColor(a.score)(`${a.score}/100`) : chalk.gray("n/a");
  const confidence =
    a.confidence_score !== null
      ? chalk.dim(`(confidence: ${a.confidence_score})`)
      : "";
  lines.push(`  ${chalk.bold(a.panelist_name)} ${chalk.dim(`\u2014 ${a.focus_area}`)}  ${score} ${confidence}`);
  if (a.reasoning) {
    lines.push(`    ${chalk.dim(truncate(a.reasoning, 200))}`);
  }
  if (a.logical_fallacies.length > 0) {
    lines.push(`    ${chalk.yellow("Fallacies:")} ${a.logical_fallacies.join(", ")}`);
  }
  if (a.missing_context.length > 0) {
    lines.push(`    ${chalk.yellow("Missing context:")} ${a.missing_context.join(", ")}`);
  }
  return lines.join("\n");
}

export function formatClaimDetail(d: ClaimDetail): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.dim(`\n\u2500\u2500\u2500 Claim Report \u2500\u2500\u2500\n`));
  lines.push(chalk.bold.white(d.claim));
  lines.push("");

  // Conclusion
  const conclusion = conclusionColor(d.conclusion_label)(d.conclusion_label);
  const score =
    d.lenz_score !== null
      ? scoreColor(d.lenz_score)(`${d.lenz_score}/100`)
      : chalk.gray("n/a");
  lines.push(`${chalk.bold("Verdict:")} ${conclusion}  ${chalk.bold("Score:")} ${score}`);

  if (d.low_confidence) lines.push(chalk.yellow("  \u26a0 Low confidence"));
  if (d.is_time_dependent) lines.push(chalk.yellow("  \u23f0 Time-dependent claim"));
  if (d.warnings.length > 0) {
    d.warnings.forEach((w) => lines.push(chalk.yellow(`  \u26a0 ${w}`)));
  }

  lines.push(`${chalk.bold("Domain:")} ${chalk.cyan(d.domain)}`);
  if (d.entities.length > 0) {
    lines.push(`${chalk.bold("Entities:")} ${d.entities.join(", ")}`);
  }
  if (d.presumed_intent) {
    lines.push(`${chalk.bold("Intent:")} ${d.presumed_intent}`);
  }

  // Executive summary
  lines.push(`\n${chalk.bold("Summary")}`);
  lines.push(d.executive_summary);

  // Sources
  if (d.sources.length > 0) {
    lines.push(`\n${chalk.bold("Sources")} ${chalk.dim(`(${d.sources.length})`)}`);
    d.sources.forEach((src, i) => lines.push(formatSource(src, i)));
  }

  // Debate
  if (d.debate_pro.argument || d.debate_con.argument) {
    lines.push(`\n${chalk.bold("Debate")}`);
    if (d.debate_pro.argument) {
      lines.push(`  ${chalk.green("PRO:")} ${d.debate_pro.argument}`);
      if (d.debate_pro.rebuttal) lines.push(`  ${chalk.dim("Rebuttal:")} ${d.debate_pro.rebuttal}`);
    }
    if (d.debate_con.argument) {
      lines.push(`  ${chalk.red("CON:")} ${d.debate_con.argument}`);
      if (d.debate_con.rebuttal) lines.push(`  ${chalk.dim("Rebuttal:")} ${d.debate_con.rebuttal}`);
    }
  }

  // Assessments
  if (d.assessments.length > 0) {
    lines.push(`\n${chalk.bold("Panel Assessments")}`);
    d.assessments.forEach((a) => {
      lines.push(formatAssessment(a));
      lines.push("");
    });
  }

  // Adjudication
  if (d.adjudication_summary) {
    lines.push(`${chalk.bold("Adjudication")}`);
    lines.push(d.adjudication_summary);
  }

  // Consensus
  if (d.consensus.confidence_score !== null) {
    const conf = scoreColor(d.consensus.confidence_score)(`${d.consensus.confidence_score}`);
    lines.push(`\n${chalk.bold("Consensus:")} confidence ${conf}${d.consensus.unanimous ? chalk.green(" (unanimous)") : ""}${d.consensus.score_spread !== null ? chalk.dim(` spread: ${d.consensus.score_spread}`) : ""}`);
  }

  // Meta
  lines.push(chalk.dim(`\nID: ${d.claim_id}`));
  if (d.url) lines.push(chalk.dim(`URL: ${d.url}`));
  if (d.published_at) lines.push(chalk.dim(`Published: ${d.published_at}`));
  lines.push(chalk.dim(`\u2500\u2500\u2500 end \u2500\u2500\u2500`));

  return lines.join("\n");
}

// --- Domains ---

export function formatDomains(result: DomainsResult): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`\nAvailable Domains`) + chalk.dim(` (${result.domains.length})\n`));
  result.domains.forEach((d) => lines.push(`  ${chalk.cyan(d)}`));
  return lines.join("\n");
}

// --- Podcasts ---

function formatPodcastItem(ep: PodcastEpisode): string {
  const num = chalk.dim(`#${ep.episode_number.toString().padStart(3)}`);
  return `${num} ${chalk.bold.white(ep.episode_title)}\n     ${chalk.dim(ep.episode_date)}  ${chalk.dim(ep.claim_id)}`;
}

export function formatPodcasts(result: PodcastListResult): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`\nLenz Podcasts`) + chalk.dim(` (${result.episodes.length} episodes)\n`));
  result.episodes.forEach((ep) => {
    lines.push(formatPodcastItem(ep));
    lines.push("");
  });
  return lines.join("\n");
}

// --- Generic JSON ---

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
