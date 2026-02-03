// Copilot I/O Contract Types

export type CopilotMode = "DEMO" | "ACTIVE_EVENT" | "PLANNING" | "POST_EVENT_REVIEW";

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
}
