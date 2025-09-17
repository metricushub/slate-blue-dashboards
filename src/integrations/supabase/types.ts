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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          action_url: string | null
          client_id: string
          created_at: string
          dismissed: boolean | null
          id: string
          is_read: boolean | null
          level: string
          message: string
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          client_id: string
          created_at?: string
          dismissed?: boolean | null
          id?: string
          is_read?: boolean | null
          level: string
          message: string
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          client_id?: string
          created_at?: string
          dismissed?: boolean | null
          id?: string
          is_read?: boolean | null
          level?: string
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          client_id: string
          created_at: string
          external_id: string | null
          id: string
          last_sync: string
          name: string
          objective: string | null
          platform: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync?: string
          name: string
          objective?: string | null
          platform: string
          status: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync?: string
          name?: string
          objective?: string | null
          platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_access: {
        Row: {
          business_manager: string | null
          client_id: string
          created_at: string
          ga_property_id: string | null
          ga4_property_id: string | null
          google_ads_customer_id: string | null
          gtm_container_id: string | null
          has_ga4_access: boolean | null
          has_google_ads_access: boolean | null
          has_meta_access: boolean | null
          id: string
          meta_ad_account_id: string | null
          notes: string | null
          search_console_url: string | null
          updated_at: string
        }
        Insert: {
          business_manager?: string | null
          client_id: string
          created_at?: string
          ga_property_id?: string | null
          ga4_property_id?: string | null
          google_ads_customer_id?: string | null
          gtm_container_id?: string | null
          has_ga4_access?: boolean | null
          has_google_ads_access?: boolean | null
          has_meta_access?: boolean | null
          id?: string
          meta_ad_account_id?: string | null
          notes?: string | null
          search_console_url?: string | null
          updated_at?: string
        }
        Update: {
          business_manager?: string | null
          client_id?: string
          created_at?: string
          ga_property_id?: string | null
          ga4_property_id?: string | null
          google_ads_customer_id?: string | null
          gtm_container_id?: string | null
          has_ga4_access?: boolean | null
          has_google_ads_access?: boolean | null
          has_meta_access?: boolean | null
          id?: string
          meta_ad_account_id?: string | null
          notes?: string | null
          search_console_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          budget_month: number | null
          budget_spent_month: number | null
          created_at: string
          ga4_last_event_at: string | null
          goals_cpa: number | null
          goals_leads: number | null
          goals_roas: number | null
          id: string
          last_update: string
          latest_cpa: number | null
          latest_leads: number | null
          latest_roas: number | null
          logo_url: string | null
          monthly_budget: number | null
          name: string
          owner: string
          segment: string | null
          stage: string
          status: string
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          budget_month?: number | null
          budget_spent_month?: number | null
          created_at?: string
          ga4_last_event_at?: string | null
          goals_cpa?: number | null
          goals_leads?: number | null
          goals_roas?: number | null
          id?: string
          last_update?: string
          latest_cpa?: number | null
          latest_leads?: number | null
          latest_roas?: number | null
          logo_url?: string | null
          monthly_budget?: number | null
          name: string
          owner: string
          segment?: string | null
          stage: string
          status: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          budget_month?: number | null
          budget_spent_month?: number | null
          created_at?: string
          ga4_last_event_at?: string | null
          goals_cpa?: number | null
          goals_leads?: number | null
          goals_roas?: number | null
          id?: string
          last_update?: string
          latest_cpa?: number | null
          latest_leads?: number | null
          latest_roas?: number | null
          logo_url?: string | null
          monthly_budget?: number | null
          name?: string
          owner?: string
          segment?: string | null
          stage?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      metrics: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          client_id: string
          conv_rate: number | null
          conversions: number | null
          cpa: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          platform: string
          revenue: number | null
          roas: number | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          client_id: string
          conv_rate?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          client_id?: string
          conv_rate?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform?: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string
          id: string
          pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string
          id?: string
          pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      optimizations: {
        Row: {
          campaigns: string[] | null
          client_id: string
          created_at: string
          expected_impact: string | null
          hypothesis: string | null
          id: string
          notes: string | null
          objective: string | null
          result_summary: string | null
          review_date: string | null
          start_date: string
          status: string
          target_metric: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          campaigns?: string[] | null
          client_id: string
          created_at?: string
          expected_impact?: string | null
          hypothesis?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          result_summary?: string | null
          review_date?: string | null
          start_date: string
          status?: string
          target_metric?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          campaigns?: string[] | null
          client_id?: string
          created_at?: string
          expected_impact?: string | null
          hypothesis?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          result_summary?: string | null
          review_date?: string | null
          start_date?: string
          status?: string
          target_metric?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          owner: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
