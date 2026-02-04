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
            referencedRelation: "scenarios"
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
      [_ in never]: never
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
