// --- Response types ---

export interface OgImages {
  landscape: string;
  square: string;
  portrait: string;
}

export interface ClaimListItem {
  claim_id: string;
  url: string;
  claim: string;
  domain: string;
  entities: string[];
  conclusion_label: string;
  lenz_score: number | null;
  executive_summary: string;
  published_at: string | null;
  og_images: OgImages;
  podcast_episode_number: number | null;
}

export interface ClaimListResult {
  items: ClaimListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface Source {
  source_name: string;
  title: string;
  url: string;
  snippet: string;
  stance: string;
  date: string;
}

export interface DebateSide {
  role: string;
  argument: string;
  rebuttal: string;
}

export interface Assessment {
  panelist_name: string;
  focus_area: string;
  score: number | null;
  confidence_score: number | null;
  reasoning: string;
  weakest_sources: string[];
  logical_fallacies: string[];
  missing_context: string[];
}

export interface Consensus {
  confidence_score: number | null;
  unanimous: boolean;
  score_spread: number | null;
}

export interface Annotation {
  id: number;
  section: string;
  anchor_text: string;
  body: string;
  created_at: string;
}

export interface ClaimDetail {
  claim_id: string;
  url: string;
  claim: string;
  domain: string;
  entities: string[];
  presumed_intent: string;
  conclusion_label: string;
  lenz_score: number | null;
  low_confidence: boolean;
  executive_summary: string;
  warnings: string[];
  is_time_dependent: boolean;
  created_at: string;
  published_at: string | null;
  modified_at: string | null;
  og_images: OgImages;
  sources: Source[];
  debate_pro: DebateSide;
  debate_con: DebateSide;
  assessments: Assessment[];
  adjudication_summary: string;
  consensus: Consensus;
  annotations: Annotation[];
  podcast_episode_number: number | null;
  visibility: string | null;
}

export interface DomainsResult {
  domains: string[];
}

export interface PodcastEpisode {
  episode_number: number;
  episode_title: string;
  episode_date: string;
  audio_url: string;
  episode_url: string;
  claim_id: string;
}

export interface PodcastListResult {
  episodes: PodcastEpisode[];
}

// --- Client ---

export interface LenzConfig {
  token?: string;
  baseUrl?: string;
}

export class LenzClient {
  private token?: string;
  private baseUrl: string;

  constructor(config: LenzConfig = {}) {
    this.token = config.token;
    this.baseUrl = (config.baseUrl || "https://lenz.io").replace(/\/$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    options: { params?: Record<string, string>; body?: unknown; auth?: boolean } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v) url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {};
    if (options.auth || this.token) {
      if (!this.token) throw new Error("Authentication required. Set LENZ_TOKEN or use --token.");
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // --- Public endpoints ---

  async claims(opts: {
    search?: string;
    domain?: string;
    entity?: string;
    sort?: string;
    page?: number;
  } = {}): Promise<ClaimListResult> {
    return this.request<ClaimListResult>("GET", "/api/v1/claims", {
      params: {
        search: opts.search || "",
        domain: opts.domain || "",
        entity: opts.entity || "",
        sort: opts.sort || "recent",
        page: String(opts.page || 1),
      },
    });
  }

  async claim(claimId: string): Promise<ClaimDetail> {
    return this.request<ClaimDetail>("GET", `/api/v1/claims/${encodeURIComponent(claimId)}`);
  }

  async domains(): Promise<DomainsResult> {
    return this.request<DomainsResult>("GET", "/api/v1/domains");
  }

  async podcasts(): Promise<PodcastListResult> {
    return this.request<PodcastListResult>("GET", "/api/v1/podcasts");
  }

  // --- Authenticated endpoints ---

  async submit(text: string, sourceUrl?: string, visibility?: string): Promise<unknown> {
    return this.request("POST", "/api/v1/claims", {
      auth: true,
      body: { text, source_url: sourceUrl || "", visibility: visibility || "" },
    });
  }

  async continueSubmit(taskId: string, text: string): Promise<unknown> {
    return this.request("POST", `/api/v1/claims/${encodeURIComponent(taskId)}/continue`, {
      auth: true,
      body: { text },
    });
  }

  async status(taskId: string): Promise<unknown> {
    return this.request("GET", `/api/v1/status/${encodeURIComponent(taskId)}`, { auth: true });
  }

  async myClaims(page?: number, pageSize?: number): Promise<unknown> {
    return this.request("GET", "/api/v1/me/claims", {
      auth: true,
      params: {
        page: String(page || 1),
        page_size: String(pageSize || 20),
      },
    });
  }

  async myClaim(claimId: string): Promise<ClaimDetail> {
    return this.request<ClaimDetail>("GET", `/api/v1/me/claims/${encodeURIComponent(claimId)}`, { auth: true });
  }

  async deleteClaim(claimId: string): Promise<void> {
    return this.request("DELETE", `/api/v1/me/claims/${encodeURIComponent(claimId)}`, { auth: true });
  }

  async setVisibility(claimId: string, visibility: string): Promise<unknown> {
    return this.request("PATCH", `/api/v1/me/claims/${encodeURIComponent(claimId)}/visibility`, {
      auth: true,
      body: { visibility },
    });
  }

  async chat(claimId: string): Promise<unknown> {
    return this.request("GET", `/api/v1/chat/${encodeURIComponent(claimId)}`, { auth: true });
  }

  async sendChat(claimId: string, message: string): Promise<unknown> {
    return this.request("POST", `/api/v1/chat/${encodeURIComponent(claimId)}`, {
      auth: true,
      body: { message },
    });
  }

  async resetChat(claimId: string): Promise<void> {
    return this.request("DELETE", `/api/v1/chat/${encodeURIComponent(claimId)}`, { auth: true });
  }
}
