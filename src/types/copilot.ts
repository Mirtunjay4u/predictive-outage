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
  [key: string]: unknown;
}

export interface CopilotRequest {
  mode?: CopilotMode;
  user_message: string;
  context_packet: CopilotContextPacket;
  retrieved_knowledge: string[];
  constraints: string[];
}

export interface CopilotResponse {
  mode_banner: string;
  framing_line: string;
  insights: string[];
  why_it_helps: string;
  disclaimer: string;
}
