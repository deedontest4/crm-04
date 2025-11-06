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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string
        }
        Relationships: []
      }
      asset_allocations: {
        Row: {
          asset_id: string
          created_at: string
          created_by: string
          department: string | null
          id: string
          remarks: string | null
          status: string
          transaction_date: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          created_by: string
          department?: string | null
          id?: string
          remarks?: string | null
          status?: string
          transaction_date?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          id?: string
          remarks?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_allocations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_allocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      asset_software_links: {
        Row: {
          asset_id: string
          assigned_date: string
          created_at: string
          created_by: string
          id: string
          license_id: string
        }
        Insert: {
          asset_id: string
          assigned_date?: string
          created_at?: string
          created_by: string
          id?: string
          license_id: string
        }
        Update: {
          asset_id?: string
          assigned_date?: string
          created_at?: string
          created_by?: string
          id?: string
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_software_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_software_links_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_photo: string | null
          asset_tag: string
          assigned_to: string | null
          brand: string | null
          category: string | null
          confidentiality_level: string | null
          cost: number | null
          created_at: string
          created_by: string
          department: string | null
          description: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          processor: string | null
          purchase_date: string | null
          purchased_from: string | null
          ram: string | null
          serial_number: string | null
          site: string | null
          status: string
          storage: string | null
          type: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_photo?: string | null
          asset_tag: string
          assigned_to?: string | null
          brand?: string | null
          category?: string | null
          confidentiality_level?: string | null
          cost?: number | null
          created_at?: string
          created_by: string
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          processor?: string | null
          purchase_date?: string | null
          purchased_from?: string | null
          ram?: string | null
          serial_number?: string | null
          site?: string | null
          status?: string
          storage?: string | null
          type: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_photo?: string | null
          asset_tag?: string
          assigned_to?: string | null
          brand?: string | null
          category?: string | null
          confidentiality_level?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          department?: string | null
          description?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          processor?: string | null
          purchase_date?: string | null
          purchased_from?: string | null
          ram?: string | null
          serial_number?: string | null
          site?: string | null
          status?: string
          storage?: string | null
          type?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      backup_history: {
        Row: {
          backup_name: string
          backup_type: string
          created_at: string
          created_by: string
          file_size: number
          id: string
          metadata: Json | null
          record_count: number
          storage_path: string | null
          table_count: number
        }
        Insert: {
          backup_name: string
          backup_type: string
          created_at?: string
          created_by: string
          file_size: number
          id?: string
          metadata?: Json | null
          record_count: number
          storage_path?: string | null
          table_count: number
        }
        Update: {
          backup_name?: string
          backup_type?: string
          created_at?: string
          created_by?: string
          file_size?: number
          id?: string
          metadata?: Json | null
          record_count?: number
          storage_path?: string | null
          table_count?: number
        }
        Relationships: []
      }
      compliance: {
        Row: {
          assigned_to: string | null
          category: string
          check_name: string
          checked_by: string | null
          created_at: string
          created_by: string
          description: string | null
          findings: string | null
          id: string
          last_checked: string | null
          next_check_due: string | null
          remediation_plan: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          check_name: string
          checked_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          findings?: string | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          remediation_plan?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          check_name?: string
          checked_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          findings?: string | null
          id?: string
          last_checked?: string | null
          next_check_due?: string | null
          remediation_plan?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      import_export_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_name: string
          entity_type: string
          id: string
          log_level: string
          operation_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_name: string
          entity_type: string
          id?: string
          log_level: string
          operation_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_name?: string
          entity_type?: string
          id?: string
          log_level?: string
          operation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      incident_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          incident_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          incident_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          incident_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_attachments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          description: string | null
          first_response_at: string | null
          id: string
          impacted_service: string
          priority: string
          reported_by: string
          resolution_summary: string | null
          resolved_at: string | null
          root_cause: string | null
          severity: string
          sla_resolution_breached: boolean | null
          sla_response_breached: boolean | null
          sla_target_resolution_hours: number | null
          sla_target_response_hours: number | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          impacted_service: string
          priority?: string
          reported_by: string
          resolution_summary?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          sla_resolution_breached?: boolean | null
          sla_response_breached?: boolean | null
          sla_target_resolution_hours?: number | null
          sla_target_response_hours?: number | null
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          impacted_service?: string
          priority?: string
          reported_by?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          root_cause?: string | null
          severity?: string
          sla_resolution_breached?: boolean | null
          sla_response_breached?: boolean | null
          sla_target_resolution_hours?: number | null
          sla_target_response_hours?: number | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          cost: number | null
          created_at: string
          created_by: string
          expiry_date: string | null
          id: string
          license_key: string | null
          notes: string | null
          purchase_date: string | null
          renewal_status: string | null
          seats_total: number | null
          seats_used: number | null
          software_name: string
          updated_at: string
          vendor: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          created_by: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          notes?: string | null
          purchase_date?: string | null
          renewal_status?: string | null
          seats_total?: number | null
          seats_used?: number | null
          software_name: string
          updated_at?: string
          vendor: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          created_by?: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          notes?: string | null
          purchase_date?: string | null
          renewal_status?: string | null
          seats_total?: number | null
          seats_used?: number | null
          software_name?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      monitoring: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_message: string | null
          alert_triggered: boolean
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          resolved: boolean
          resolved_at: string | null
          service_name: string
          status: string
          threshold_value: number | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_message?: string | null
          alert_triggered?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          resolved?: boolean
          resolved_at?: string | null
          service_name: string
          status?: string
          threshold_value?: number | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_message?: string | null
          alert_triggered?: boolean
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          resolved?: boolean
          resolved_at?: string | null
          service_name?: string
          status?: string
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          performed_by: string | null
          read: boolean
          related_record_id: string | null
          related_record_route: string | null
          related_record_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          performed_by?: string | null
          read?: boolean
          related_record_id?: string | null
          related_record_route?: string | null
          related_record_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          performed_by?: string | null
          read?: boolean
          related_record_id?: string | null
          related_record_route?: string | null
          related_record_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_access: {
        Row: {
          has_access: boolean
          id: string
          page_id: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          has_access?: boolean
          id?: string
          page_id: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          has_access?: boolean
          id?: string
          page_id?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_access_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          route: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          route: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          route?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      password_change_logs: {
        Row: {
          changed_by_id: string
          changed_by_username: string
          created_at: string
          id: string
          trigger_type: string
          user_id: string
          username: string
        }
        Insert: {
          changed_by_id: string
          changed_by_username: string
          created_at?: string
          id?: string
          trigger_type: string
          user_id: string
          username: string
        }
        Update: {
          changed_by_id?: string
          changed_by_username?: string
          created_at?: string
          id?: string
          trigger_type?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          last_login: string | null
          role: string
          status: string | null
          tech_lead_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string | null
          tech_lead_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string | null
          tech_lead_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tech_lead_id_fkey"
            columns: ["tech_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      report_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          file_path: string | null
          filters: Json | null
          generated_by: string
          id: string
          records_processed: number | null
          report_name: string
          report_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          file_path?: string | null
          filters?: Json | null
          generated_by: string
          id?: string
          records_processed?: number | null
          report_name: string
          report_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          file_path?: string | null
          filters?: Json | null
          generated_by?: string
          id?: string
          records_processed?: number | null
          report_name?: string
          report_type?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          category: string
          cost: number | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          renewal_date: string
          seats_total: number | null
          seats_used: number | null
          status: string
          tool_name: string
          updated_at: string
          vendor: string
        }
        Insert: {
          billing_cycle?: string
          category: string
          cost?: number | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          renewal_date: string
          seats_total?: number | null
          seats_used?: number | null
          status?: string
          tool_name: string
          updated_at?: string
          vendor: string
        }
        Update: {
          billing_cycle?: string
          category?: string
          cost?: number | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          renewal_date?: string
          seats_total?: number | null
          seats_used?: number | null
          status?: string
          tool_name?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_number: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      updates: {
        Row: {
          affected_systems: string | null
          completed_date: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          notes: string | null
          performed_by: string | null
          scheduled_date: string | null
          severity: string
          status: string
          title: string
          update_type: string
          updated_at: string
        }
        Insert: {
          affected_systems?: string | null
          completed_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          severity?: string
          status?: string
          title: string
          update_type: string
          updated_at?: string
        }
        Update: {
          affected_systems?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          severity?: string
          status?: string
          title?: string
          update_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "updates_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warranties: {
        Row: {
          asset_id: string
          attachment_url: string | null
          coverage_notes: string | null
          created_at: string
          created_by: string
          expiry_date: string
          id: string
          renewal_status: string
          start_date: string
          updated_at: string
          vendor: string
        }
        Insert: {
          asset_id: string
          attachment_url?: string | null
          coverage_notes?: string | null
          created_at?: string
          created_by: string
          expiry_date: string
          id?: string
          renewal_status?: string
          start_date: string
          updated_at?: string
          vendor: string
        }
        Update: {
          asset_id?: string
          attachment_url?: string | null
          coverage_notes?: string | null
          created_at?: string
          created_by?: string
          expiry_date?: string
          id?: string
          renewal_status?: string
          start_date?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_goal_progress: {
        Args: { current_rating_param: string; target_rating_param: string }
        Returns: number
      }
      calculate_next_upgrade_date: {
        Args: { approved_at_param: string }
        Returns: string
      }
      can_upgrade_rating: {
        Args: {
          approved_at_param: string
          current_rating_param: string
          current_status_param: string
          target_rating_param: string
        }
        Returns: boolean
      }
      cleanup_old_notifications: { Args: never; Returns: undefined }
      generate_incident_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_my_tech_lead_id: { Args: never; Returns: string }
      get_user_available_capacity: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_total_allocation: {
        Args: { user_id_param: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_teammate: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      send_goal_reminders: { Args: never; Returns: undefined }
      test_employee_rating_insert: {
        Args: {
          p_rating: string
          p_skill_id: string
          p_subskill_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_leaderboard_history: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "employee" | "tech_lead" | "management" | "admin"
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
      app_role: ["employee", "tech_lead", "management", "admin"],
    },
  },
} as const
