// Copilot I/O Contract Types

export type CopilotMode = "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";
export type CopilotEngine = "lovable" | "nemotron";

export interface CopilotContextPacket {
  scenario_id?: string;
  scenario_name?: string;
  lifecycle_stage?: string;
  stage?: boolean;
  operator_role?: string;
  scenario_time?: string;
  notes?: string;
  description?: string;
  outage_type?: string;
  scheduled_at?: string;
  [key: string]: unknown;
}

export interface CopilotRequest {
  mode?: CopilotMode;
  user_message?: string;
  message?: string;
  scenario_id?: string;
  scenario?: CopilotContextPacket;
  context_packet?: CopilotContextPacket;
  retrieved_knowledge?: string[];
  constraints?: string[];
}

export interface CopilotInsight {
  title: string;
  bullets: string[];
}

export interface CopilotResponse {
  mode_banner: string;
  framing_line?: string;
  insights: CopilotInsight[];
  assumptions: string[];
  source_notes: string[];
  disclaimer: string;
  /** Runtime model attribution — shown in UI for auditability */
  model_engine?: string;
  /** Whether a fallback was triggered */
  fallback_used?: boolean;
  fallback_reason?: string;
}

/**
 * Strict Operator Output Contract — fixed sections rendered in Copilot Studio.
 * Mapped from CopilotResponse on the frontend.
 */
export interface OperatorOutputContract {
  mode: string;
  situation_summary: string;
  etr_band_confidence: string;
  critical_load_runway: string;
  recommendations: string[];
  blocked_actions: { action: string; reason: string }[];
  operator_notes: string[];
  source_notes: string[];
}

/** Map a raw CopilotResponse into the strict section contract */
export function mapToOperatorContract(res: CopilotResponse): OperatorOutputContract {
  const findSection = (keyword: string): CopilotInsight | undefined =>
    res.insights.find(i => i.title.toLowerCase().includes(keyword.toLowerCase()));

  const situationInsight = findSection('situation') || findSection('summary') || res.insights[0];
  const etrInsight = findSection('etr') || findSection('restoration');
  const criticalInsight = findSection('critical') || findSection('runway') || findSection('load');
  const recInsight = findSection('recommend') || findSection('advisory') || findSection('action');
  const blockedInsight = findSection('blocked') || findSection('constraint');
  const notesInsight = findSection('operator') || findSection('approval') || findSection('note');

  // Sections that weren't matched get collected as overflow
  const matched = new Set([situationInsight, etrInsight, criticalInsight, recInsight, blockedInsight, notesInsight].filter(Boolean));
  const overflow = res.insights.filter(i => !matched.has(i));

  return {
    mode: res.mode_banner,
    situation_summary: situationInsight
      ? [situationInsight.title, ...situationInsight.bullets].join(' ')
      : res.framing_line || 'No situation summary available.',
    etr_band_confidence: etrInsight
      ? etrInsight.bullets.join(' • ')
      : 'ETR data not available in this analysis.',
    critical_load_runway: criticalInsight
      ? criticalInsight.bullets.join(' • ')
      : 'No critical load runway data.',
    recommendations: recInsight
      ? recInsight.bullets
      : overflow.flatMap(i => i.bullets).slice(0, 5),
    blocked_actions: blockedInsight
      ? blockedInsight.bullets.map(b => {
          const parts = b.split(/[:\-—]+/);
          return { action: parts[0]?.trim() || b, reason: parts.slice(1).join(':').trim() || 'Policy constraint' };
        })
      : [{ action: 'No autonomous dispatch or switching', reason: 'All actions require explicit operator authorization' }],
    operator_notes: notesInsight
      ? notesInsight.bullets
      : ['Human review and approval required before any field action.'],
    source_notes: res.source_notes || [],
  };
}
