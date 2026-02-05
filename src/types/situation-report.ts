// Situation Report Types

export type ReportStatus = 'draft' | 'approved' | 'rejected' | 'sent';

export type DeliveryChannel = 'email' | 'message';

export type AudienceType = 'executive_leadership' | 'operations_team' | 'external_stakeholders';

export interface SituationReportSection {
  title: string;
  content: string[] | string;
}

export interface ApprovalMetadata {
  status: ReportStatus;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  reviewer_comments?: string;
}

export interface DeliveryMetadata {
  sent_by: string;
  sent_at: string;
  delivery_channel: DeliveryChannel;
  audience: AudienceType;
  message_note?: string;
}

export interface SituationReport {
  title: string;
  mode_banner: string;
  generated_at: string;
  sections: {
    situation_summary: string;
    what_changed: string[];
    critical_load_continuity: {
      remaining_backup_hours: number | null;
      runway_status: string | null;
      escalation_required: boolean;
      critical_load_types: string[];
    };
    key_uncertainties: string[];
    leadership_implications: string[];
    source_notes: string[];
  };
  disclaimer: string;
  approval?: ApprovalMetadata;
  delivery?: DeliveryMetadata;
  customer_comms?: CustomerCommsMetadata;
}

export type CommsTone = 'calm' | 'direct' | 'reassuring';

export interface CustomerCommsDrafts {
  sms: string;
  email: string;
  web_banner: string;
}

export interface CustomerCommsMetadata {
  generated_at: string;
  tone: CommsTone;
  drafts: CustomerCommsDrafts;
}

export interface SituationReportRequest {
  event_id: string;
  event_data: {
    name: string;
    service_area: string | null;
    outage_type: string | null;
    priority: string | null;
    lifecycle_stage: string;
    etr_earliest: string | null;
    etr_latest: string | null;
    etr_expected: string | null;
    etr_confidence: string | null;
    etr_risk_level: string | null;
    critical_runway_status: string | null;
    backup_runtime_remaining_hours: number | null;
    has_critical_load: boolean | null;
    critical_load_types: string[];
    requires_escalation: boolean | null;
    customers_impacted: number | null;
    etr_uncertainty_drivers: string[];
  };
  status_history: Array<{
    recorded_at: string;
    etr_earliest: string | null;
    etr_expected: string | null;
    etr_latest: string | null;
    etr_confidence: string | null;
    etr_risk_level: string | null;
    critical_runway_status: string | null;
    backup_runtime_remaining_hours: number | null;
    uncertainty_drivers: string[] | null;
    change_note: string | null;
  }>;
}
