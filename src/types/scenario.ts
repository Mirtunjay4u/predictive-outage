export type LifecycleStage = 'Pre-Event' | 'Event' | 'Post-Event';

export interface Scenario {
  id: string;
  name: string;
  description: string | null;
  stage: boolean;
  scenario_time: string | null;
  lifecycle_stage: LifecycleStage;
  operator_role: string | null;
  notes: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScenarioInsert {
  name: string;
  description?: string | null;
  stage?: boolean;
  scenario_time?: string | null;
  lifecycle_stage?: LifecycleStage;
  operator_role?: string | null;
  notes?: string | null;
  priority?: string | null;
}

export interface ScenarioUpdate extends Partial<ScenarioInsert> {}

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
