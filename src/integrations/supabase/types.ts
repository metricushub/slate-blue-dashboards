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
      account_bindings: {
        Row: {
          created_at: string
          customer_id: string
          last_verified_at: string
          resolved_login_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          last_verified_at?: string
          resolved_login_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          last_verified_at?: string
          resolved_login_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      accounts_map: {
        Row: {
          account_name: string | null
          account_type: string | null
          client_id: string
          company_id: string | null
          created_at: string
          currency_code: string | null
          customer_id: string
          id: string
          is_manager: boolean | null
          status: string
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          client_id: string
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id: string
          id?: string
          is_manager?: boolean | null
          status?: string
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          client_id?: string
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string
          id?: string
          is_manager?: boolean | null
          status?: string
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_map_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_financial_entries_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          target_amount: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          target_amount: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          target_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_ads_connections: {
        Row: {
          client_id: string
          created_at: string
          customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_credentials: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          refresh_token: string
          token_expiry: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          refresh_token: string
          token_expiry?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          refresh_token?: string
          token_expiry?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      google_ads_ingestions: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          end_date: string
          error_message: string | null
          id: string
          records_processed: number | null
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          end_date: string
          error_message?: string | null
          id?: string
          records_processed?: number | null
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          end_date?: string
          error_message?: string | null
          id?: string
          records_processed?: number | null
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          login_customer_id: string | null
          refresh_token: string
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          login_customer_id?: string | null
          refresh_token: string
          token_expiry: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          login_customer_id?: string | null
          refresh_token?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          new_value: string | null
          previous_value: string | null
          scheduled_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          new_value?: string | null
          previous_value?: string | null
          scheduled_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          new_value?: string | null
          previous_value?: string | null
          scheduled_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          cost_per_lead: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_lead?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_lead?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_stages: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_closed_lost: boolean | null
          is_closed_won: boolean | null
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          name: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_closed_lost?: boolean | null
          is_closed_won?: boolean | null
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          lost_at: string | null
          lost_reason: string | null
          name: string
          next_follow_up_at: string | null
          notes: string | null
          owner: string | null
          phone: string | null
          probability: number | null
          source: string | null
          stage: string
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name: string
          next_follow_up_at?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          name?: string
          next_follow_up_at?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          client_id: string | null
          conv_rate: number | null
          conversions: number | null
          cpa: number | null
          created_at: string
          ctr: number | null
          customer_id: string | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          platform: string
          revenue: number | null
          roas: number | null
          row_key: string | null
          spend: number | null
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          client_id?: string | null
          conv_rate?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          customer_id?: string | null
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform: string
          revenue?: number | null
          roas?: number | null
          row_key?: string | null
          spend?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          client_id?: string | null
          conv_rate?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          customer_id?: string | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          platform?: string
          revenue?: number | null
          roas?: number | null
          row_key?: string | null
          spend?: number | null
          updated_at?: string
        }
        Relationships: [
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
      pending_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      sales_funnel_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          stages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          stages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          stages?: Json
          updated_at?: string
          user_id?: string
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
      team_members: {
        Row: {
          clients_count: number | null
          created_at: string
          email: string
          id: string
          last_activity: string | null
          name: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clients_count?: number | null
          created_at?: string
          email: string
          id?: string
          last_activity?: string | null
          name: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clients_count?: number | null
          created_at?: string
          email?: string
          id?: string
          last_activity?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      google_ads_metrics: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          client_id: string | null
          conv_rate: number | null
          conversions: number | null
          cost_micros: number | null
          cpa: number | null
          created_at: string | null
          ctr: number | null
          customer_id: string | null
          date: string | null
          impressions: number | null
          leads: number | null
          platform: string | null
          revenue: number | null
          roas: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          client_id?: string | null
          conv_rate?: number | null
          conversions?: number | null
          cost_micros?: number | null
          cpa?: number | null
          created_at?: string | null
          ctr?: number | null
          customer_id?: string | null
          date?: string | null
          impressions?: number | null
          leads?: number | null
          platform?: string | null
          revenue?: number | null
          roas?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          client_id?: string | null
          conv_rate?: number | null
          conversions?: number | null
          cost_micros?: number | null
          cpa?: number | null
          created_at?: string | null
          ctr?: number | null
          customer_id?: string | null
          date?: string | null
          impressions?: number | null
          leads?: number | null
          platform?: string | null
          revenue?: number | null
          roas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_metrics_row_key: {
        Args: {
          p_campaign_id: string
          p_customer_id: string
          p_date: string
          p_platform: string
        }
        Returns: string
      }
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
