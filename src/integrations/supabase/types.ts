export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          fault_id: string | null
          feeder_id: string | null
          id: string
          lat: number
          lng: number
          meta: Json | null
          name: string
          transformer_id: string | null
          updated_at: string
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          fault_id?: string | null
          feeder_id?: string | null
          id?: string
          lat: number
          lng: number
          meta?: Json | null
          name: string
          transformer_id?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          fault_id?: string | null
          feeder_id?: string | null
          id?: string
          lat?: number
          lng?: number
          meta?: Json | null
          name?: string
          transformer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crew_overtime_logs: {
        Row: {
          authorized_by: string | null
          created_at: string
          crew_id: string
          dispatch_time: string
          end_time: string | null
          event_id: string | null
          id: string
          notes: string | null
          reason: string
        }
        Insert: {
          authorized_by?: string | null
          created_at?: string
          crew_id: string
          dispatch_time?: string
          end_time?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          reason?: string
        }
        Update: {
          authorized_by?: string | null
          created_at?: string
          crew_id?: string
          dispatch_time?: string
          end_time?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_overtime_logs_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_overtime_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_overtime_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          assigned_event_id: string | null
          break_end: string | null
          break_start: string | null
          contact_phone: string | null
          created_at: string
          crew_id: string
          crew_name: string
          current_lat: number
          current_lng: number
          days_of_week: string[] | null
          dispatch_time: string | null
          eta_minutes: number | null
          id: string
          shift_end: string | null
          shift_start: string | null
          specialization: string | null
          status: Database["public"]["Enums"]["crew_status"]
          team_size: number
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          assigned_event_id?: string | null
          break_end?: string | null
          break_start?: string | null
          contact_phone?: string | null
          created_at?: string
          crew_id: string
          crew_name: string
          current_lat: number
          current_lng: number
          days_of_week?: string[] | null
          dispatch_time?: string | null
          eta_minutes?: number | null
          id?: string
          shift_end?: string | null
          shift_start?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["crew_status"]
          team_size?: number
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          assigned_event_id?: string | null
          break_end?: string | null
          break_start?: string | null
          contact_phone?: string | null
          created_at?: string
          crew_id?: string
          crew_name?: string
          current_lat?: number
          current_lng?: number
          days_of_week?: string[] | null
          dispatch_time?: string | null
          eta_minutes?: number | null
          id?: string
          shift_end?: string | null
          shift_start?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["crew_status"]
          team_size?: number
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crews_assigned_event_id_fkey"
            columns: ["assigned_event_id"]
            isOneToOne: false
            referencedRelation: "events_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crews_assigned_event_id_fkey"
            columns: ["assigned_event_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      docs_resources: {
        Row: {
          allowed_roles: string[]
          approval_date: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["doc_category"]
          change_summary: string | null
          content_index: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          is_pinned: boolean
          owner: string | null
          release_channel: Database["public"]["Enums"]["doc_release_channel"]
          reviewer: string | null
          search_keywords: string[]
          short_description: string
          status: Database["public"]["Enums"]["doc_status"]
          supersedes_doc_id: string | null
          title: string
          updated_at: string
          url_download: string | null
          url_view: string | null
          version: string
          visibility: Database["public"]["Enums"]["doc_visibility"]
        }
        Insert: {
          allowed_roles?: string[]
          approval_date?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["doc_category"]
          change_summary?: string | null
          content_index?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          is_pinned?: boolean
          owner?: string | null
          release_channel?: Database["public"]["Enums"]["doc_release_channel"]
          reviewer?: string | null
          search_keywords?: string[]
          short_description?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supersedes_doc_id?: string | null
          title: string
          updated_at?: string
          url_download?: string | null
          url_view?: string | null
          version?: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Update: {
          allowed_roles?: string[]
          approval_date?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["doc_category"]
          change_summary?: string | null
          content_index?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          is_pinned?: boolean
          owner?: string | null
          release_channel?: Database["public"]["Enums"]["doc_release_channel"]
          reviewer?: string | null
          search_keywords?: string[]
          short_description?: string
          status?: Database["public"]["Enums"]["doc_status"]
          supersedes_doc_id?: string | null
          title?: string
          updated_at?: string
          url_download?: string | null
          url_view?: string | null
          version?: string
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "docs_resources_supersedes_doc_id_fkey"
            columns: ["supersedes_doc_id"]
            isOneToOne: false
            referencedRelation: "docs_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assets: {
        Row: {
          asset_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_assets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      event_decision_log: {
        Row: {
          action_taken: string
          event_id: string
          id: string
          metadata: Json | null
          rule_impact: string | null
          source: string
          timestamp: string
          trigger: string
        }
        Insert: {
          action_taken: string
          event_id: string
          id?: string
          metadata?: Json | null
          rule_impact?: string | null
          source: string
          timestamp?: string
          trigger: string
        }
        Update: {
          action_taken?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          rule_impact?: string | null
          source?: string
          timestamp?: string
          trigger?: string
        }
        Relationships: []
      }
      event_status_history: {
        Row: {
          backup_runtime_remaining_hours: number | null
          change_note: string | null
          created_at: string
          critical_runway_status: string | null
          etr_confidence: string | null
          etr_earliest: string | null
          etr_expected: string | null
          etr_latest: string | null
          etr_risk_level: string | null
          event_id: string
          id: string
          recorded_at: string
          uncertainty_drivers: Json | null
        }
        Insert: {
          backup_runtime_remaining_hours?: number | null
          change_note?: string | null
          created_at?: string
          critical_runway_status?: string | null
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_risk_level?: string | null
          event_id: string
          id?: string
          recorded_at?: string
          uncertainty_drivers?: Json | null
        }
        Update: {
          backup_runtime_remaining_hours?: number | null
          change_note?: string | null
          created_at?: string
          critical_runway_status?: string | null
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_risk_level?: string | null
          event_id?: string
          id?: string
          recorded_at?: string
          uncertainty_drivers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_status_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_intelligence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_status_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      feeder_zones: {
        Row: {
          created_at: string
          feeder_id: string
          feeder_name: string
          geo_area: Json
          id: string
          meta: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feeder_id: string
          feeder_name: string
          geo_area: Json
          id?: string
          meta?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feeder_id?: string
          feeder_name?: string
          geo_area?: Json
          id?: string
          meta?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          backup_runtime_hours: number | null
          backup_runtime_remaining_hours: number | null
          created_at: string
          critical_escalation_threshold_hours: number | null
          critical_load_types: Json | null
          customers_impacted: number | null
          description: string | null
          eta: string | null
          etr_confidence: string | null
          etr_earliest: string | null
          etr_expected: string | null
          etr_latest: string | null
          etr_uncertainty_drivers: Json | null
          event_end_time: string | null
          event_last_update_time: string | null
          event_start_time: string | null
          fault_id: string | null
          feeder_id: string | null
          geo_area: Json | null
          geo_center: Json | null
          has_critical_load: boolean | null
          id: string
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"]
          location_name: string | null
          name: string
          notes: string | null
          operator_role: string | null
          outage_type: Database["public"]["Enums"]["outage_type"] | null
          priority: string | null
          scenario_time: string | null
          service_area: string | null
          stage: boolean
          transformer_id: string | null
          updated_at: string
        }
        Insert: {
          backup_runtime_hours?: number | null
          backup_runtime_remaining_hours?: number | null
          created_at?: string
          critical_escalation_threshold_hours?: number | null
          critical_load_types?: Json | null
          customers_impacted?: number | null
          description?: string | null
          eta?: string | null
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_uncertainty_drivers?: Json | null
          event_end_time?: string | null
          event_last_update_time?: string | null
          event_start_time?: string | null
          fault_id?: string | null
          feeder_id?: string | null
          geo_area?: Json | null
          geo_center?: Json | null
          has_critical_load?: boolean | null
          id?: string
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          location_name?: string | null
          name: string
          notes?: string | null
          operator_role?: string | null
          outage_type?: Database["public"]["Enums"]["outage_type"] | null
          priority?: string | null
          scenario_time?: string | null
          service_area?: string | null
          stage?: boolean
          transformer_id?: string | null
          updated_at?: string
        }
        Update: {
          backup_runtime_hours?: number | null
          backup_runtime_remaining_hours?: number | null
          created_at?: string
          critical_escalation_threshold_hours?: number | null
          critical_load_types?: Json | null
          customers_impacted?: number | null
          description?: string | null
          eta?: string | null
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_uncertainty_drivers?: Json | null
          event_end_time?: string | null
          event_last_update_time?: string | null
          event_start_time?: string | null
          fault_id?: string | null
          feeder_id?: string | null
          geo_area?: Json | null
          geo_center?: Json | null
          has_critical_load?: boolean | null
          id?: string
          lifecycle_stage?: Database["public"]["Enums"]["lifecycle_stage"]
          location_name?: string | null
          name?: string
          notes?: string | null
          operator_role?: string | null
          outage_type?: Database["public"]["Enums"]["outage_type"] | null
          priority?: string | null
          scenario_time?: string | null
          service_area?: string | null
          stage?: boolean
          transformer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      events_intelligence: {
        Row: {
          backup_runtime_hours: number | null
          backup_runtime_remaining_hours: number | null
          copilot_signals: Json | null
          created_at: string | null
          critical_escalation_threshold_hours: number | null
          critical_load_types: Json | null
          critical_runway_status: string | null
          customers_impacted: number | null
          description: string | null
          eta: string | null
          etr_band_hours: number | null
          etr_confidence: string | null
          etr_earliest: string | null
          etr_expected: string | null
          etr_latest: string | null
          etr_risk_level: string | null
          etr_uncertainty_drivers: Json | null
          event_end_time: string | null
          event_last_update_time: string | null
          event_start_time: string | null
          fault_id: string | null
          feeder_id: string | null
          geo_area: Json | null
          geo_center: Json | null
          has_critical_load: boolean | null
          id: string | null
          lifecycle_stage: Database["public"]["Enums"]["lifecycle_stage"] | null
          location_name: string | null
          name: string | null
          notes: string | null
          operator_role: string | null
          outage_type: Database["public"]["Enums"]["outage_type"] | null
          priority: string | null
          requires_escalation: boolean | null
          scenario_time: string | null
          service_area: string | null
          stage: boolean | null
          transformer_id: string | null
          updated_at: string | null
        }
        Insert: {
          backup_runtime_hours?: number | null
          backup_runtime_remaining_hours?: number | null
          copilot_signals?: never
          created_at?: string | null
          critical_escalation_threshold_hours?: number | null
          critical_load_types?: Json | null
          critical_runway_status?: never
          customers_impacted?: number | null
          description?: string | null
          eta?: string | null
          etr_band_hours?: never
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_risk_level?: never
          etr_uncertainty_drivers?: Json | null
          event_end_time?: string | null
          event_last_update_time?: string | null
          event_start_time?: string | null
          fault_id?: string | null
          feeder_id?: string | null
          geo_area?: Json | null
          geo_center?: Json | null
          has_critical_load?: boolean | null
          id?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage"]
            | null
          location_name?: string | null
          name?: string | null
          notes?: string | null
          operator_role?: string | null
          outage_type?: Database["public"]["Enums"]["outage_type"] | null
          priority?: string | null
          requires_escalation?: never
          scenario_time?: string | null
          service_area?: string | null
          stage?: boolean | null
          transformer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_runtime_hours?: number | null
          backup_runtime_remaining_hours?: number | null
          copilot_signals?: never
          created_at?: string | null
          critical_escalation_threshold_hours?: number | null
          critical_load_types?: Json | null
          critical_runway_status?: never
          customers_impacted?: number | null
          description?: string | null
          eta?: string | null
          etr_band_hours?: never
          etr_confidence?: string | null
          etr_earliest?: string | null
          etr_expected?: string | null
          etr_latest?: string | null
          etr_risk_level?: never
          etr_uncertainty_drivers?: Json | null
          event_end_time?: string | null
          event_last_update_time?: string | null
          event_start_time?: string | null
          fault_id?: string | null
          feeder_id?: string | null
          geo_area?: Json | null
          geo_center?: Json | null
          has_critical_load?: boolean | null
          id?: string | null
          lifecycle_stage?:
            | Database["public"]["Enums"]["lifecycle_stage"]
            | null
          location_name?: string | null
          name?: string | null
          notes?: string | null
          operator_role?: string | null
          outage_type?: Database["public"]["Enums"]["outage_type"] | null
          priority?: string | null
          requires_escalation?: never
          scenario_time?: string | null
          service_area?: string | null
          stage?: boolean | null
          transformer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_type: "Fault" | "Feeder" | "Transformer"
      crew_status:
        | "available"
        | "dispatched"
        | "en_route"
        | "on_site"
        | "returning"
      doc_category:
        | "Technical"
        | "Operational"
        | "Governance"
        | "Roadmap"
        | "Glossary"
        | "ReleaseNotes"
      doc_release_channel: "Stable" | "Beta" | "Internal"
      doc_status: "Draft" | "Approved" | "Deprecated" | "Archived"
      doc_type: "Page" | "PDF" | "ExternalLink"
      doc_visibility: "PublicDemo" | "InternalOnly" | "Restricted"
      lifecycle_stage: "Pre-Event" | "Event" | "Post-Event"
      outage_type:
        | "Storm"
        | "Flood"
        | "Heavy Rain"
        | "Heatwave"
        | "Wildfire"
        | "Lightning"
        | "Ice/Snow"
        | "High Wind"
        | "Equipment Failure"
        | "Vegetation"
        | "Unknown"
        | "Others"
        | "Snow Storm"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_type: ["Fault", "Feeder", "Transformer"],
      crew_status: [
        "available",
        "dispatched",
        "en_route",
        "on_site",
        "returning",
      ],
      doc_category: [
        "Technical",
        "Operational",
        "Governance",
        "Roadmap",
        "Glossary",
        "ReleaseNotes",
      ],
      doc_release_channel: ["Stable", "Beta", "Internal"],
      doc_status: ["Draft", "Approved", "Deprecated", "Archived"],
      doc_type: ["Page", "PDF", "ExternalLink"],
      doc_visibility: ["PublicDemo", "InternalOnly", "Restricted"],
      lifecycle_stage: ["Pre-Event", "Event", "Post-Event"],
      outage_type: [
        "Storm",
        "Flood",
        "Heavy Rain",
        "Heatwave",
        "Wildfire",
        "Lightning",
        "Ice/Snow",
        "High Wind",
        "Equipment Failure",
        "Vegetation",
        "Unknown",
        "Others",
        "Snow Storm",
      ],
    },
  },
} as const
