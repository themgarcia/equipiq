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
      email_preferences: {
        Row: {
          budgeting_season_reminders: boolean
          created_at: string
          depreciation_milestones: boolean
          id: string
          insurance_renewal_reminders: boolean
          product_updates: boolean
          replacement_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          budgeting_season_reminders?: boolean
          created_at?: string
          depreciation_milestones?: boolean
          id?: string
          insurance_renewal_reminders?: boolean
          product_updates?: boolean
          replacement_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          budgeting_season_reminders?: boolean
          created_at?: string
          depreciation_milestones?: boolean
          id?: string
          insurance_renewal_reminders?: boolean
          product_updates?: boolean
          replacement_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          allocation_type: string
          asset_id: string | null
          buyout_amount: number
          category: string
          cogs_percent: number
          created_at: string
          deposit_amount: number
          expected_resale_override: number | null
          financed_amount: number
          financing_start_date: string | null
          financing_type: string
          freight_setup: number
          id: string
          insurance_declared_value: number | null
          insurance_notes: string | null
          insurance_reviewed_at: string | null
          is_insured: boolean | null
          make: string
          model: string
          monthly_payment: number
          name: string
          other_cap_ex: number
          purchase_condition: string
          purchase_date: string
          purchase_price: number
          replacement_cost_as_of_date: string | null
          replacement_cost_new: number
          sale_date: string | null
          sale_price: number | null
          sales_tax: number
          serial_vin: string | null
          status: string
          term_months: number
          updated_at: string
          useful_life_override: number | null
          user_id: string
          year: number
        }
        Insert: {
          allocation_type?: string
          asset_id?: string | null
          buyout_amount?: number
          category: string
          cogs_percent?: number
          created_at?: string
          deposit_amount?: number
          expected_resale_override?: number | null
          financed_amount?: number
          financing_start_date?: string | null
          financing_type?: string
          freight_setup?: number
          id?: string
          insurance_declared_value?: number | null
          insurance_notes?: string | null
          insurance_reviewed_at?: string | null
          is_insured?: boolean | null
          make: string
          model: string
          monthly_payment?: number
          name: string
          other_cap_ex?: number
          purchase_condition?: string
          purchase_date: string
          purchase_price?: number
          replacement_cost_as_of_date?: string | null
          replacement_cost_new?: number
          sale_date?: string | null
          sale_price?: number | null
          sales_tax?: number
          serial_vin?: string | null
          status?: string
          term_months?: number
          updated_at?: string
          useful_life_override?: number | null
          user_id: string
          year: number
        }
        Update: {
          allocation_type?: string
          asset_id?: string | null
          buyout_amount?: number
          category?: string
          cogs_percent?: number
          created_at?: string
          deposit_amount?: number
          expected_resale_override?: number | null
          financed_amount?: number
          financing_start_date?: string | null
          financing_type?: string
          freight_setup?: number
          id?: string
          insurance_declared_value?: number | null
          insurance_notes?: string | null
          insurance_reviewed_at?: string | null
          is_insured?: boolean | null
          make?: string
          model?: string
          monthly_payment?: number
          name?: string
          other_cap_ex?: number
          purchase_condition?: string
          purchase_date?: string
          purchase_price?: number
          replacement_cost_as_of_date?: string | null
          replacement_cost_new?: number
          sale_date?: string | null
          sale_price?: number | null
          sales_tax?: number
          serial_vin?: string | null
          status?: string
          term_months?: number
          updated_at?: string
          useful_life_override?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      equipment_attachments: {
        Row: {
          created_at: string
          description: string | null
          equipment_id: string
          id: string
          insurance_declared_value: number | null
          is_insured: boolean | null
          name: string
          photo_path: string | null
          serial_number: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment_id: string
          id?: string
          insurance_declared_value?: number | null
          is_insured?: boolean | null
          name: string
          photo_path?: string | null
          serial_number?: string | null
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment_id?: string
          id?: string
          insurance_declared_value?: number | null
          is_insured?: boolean | null
          name?: string
          photo_path?: string | null
          serial_number?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_attachments_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_documents: {
        Row: {
          equipment_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          equipment_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          equipment_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feedback_replies: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          is_admin_reply: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          is_admin_reply?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_replies_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_change_log: {
        Row: {
          change_type: string
          confirmed_at: string | null
          created_at: string
          effective_date: string
          equipment_id: string | null
          equipment_name: string
          id: string
          new_declared_value: number | null
          previous_declared_value: number | null
          reason: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          change_type: string
          confirmed_at?: string | null
          created_at?: string
          effective_date?: string
          equipment_id?: string | null
          equipment_name: string
          id?: string
          new_declared_value?: number | null
          previous_declared_value?: number | null
          reason: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          change_type?: string
          confirmed_at?: string | null
          created_at?: string
          effective_date?: string
          equipment_id?: string | null
          equipment_name?: string
          id?: string
          new_declared_value?: number | null
          previous_declared_value?: number | null
          reason?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_settings: {
        Row: {
          broker_company: string | null
          broker_email: string | null
          broker_name: string | null
          broker_phone: string | null
          created_at: string
          id: string
          last_post_renewal_reminder_at: string | null
          last_pre_renewal_reminder_at: string | null
          policy_number: string | null
          policy_renewal_date: string | null
          renewal_confirmed_at: string | null
          renewal_reminder_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_company?: string | null
          broker_email?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          created_at?: string
          id?: string
          last_post_renewal_reminder_at?: string | null
          last_pre_renewal_reminder_at?: string | null
          policy_number?: string | null
          policy_renewal_date?: string | null
          renewal_confirmed_at?: string | null
          renewal_reminder_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_company?: string | null
          broker_email?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          created_at?: string
          id?: string
          last_post_renewal_reminder_at?: string | null
          last_pre_renewal_reminder_at?: string | null
          policy_number?: string | null
          policy_renewal_date?: string | null
          renewal_confirmed_at?: string | null
          renewal_reminder_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metered_usage: {
        Row: {
          created_at: string
          id: string
          quantity: number
          stripe_usage_record_id: string | null
          total_cost: number
          unit_cost: number
          usage_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          stripe_usage_record_id?: string | null
          total_cost: number
          unit_cost: number
          usage_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          stripe_usage_record_id?: string | null
          total_cost?: number
          unit_cost?: number
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          annual_revenue: string | null
          company_name: string | null
          company_website: string | null
          created_at: string
          field_employees: string | null
          full_name: string | null
          id: string
          industry: string | null
          region: string | null
          years_in_business: number | null
        }
        Insert: {
          annual_revenue?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          field_employees?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          region?: string | null
          years_in_business?: number | null
        }
        Update: {
          annual_revenue?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          field_employees?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          region?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          beta_access: boolean
          beta_access_granted_at: string | null
          beta_access_notes: string | null
          billing_interval: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_period_ends_at: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beta_access?: boolean
          beta_access_granted_at?: string | null
          beta_access_notes?: string | null
          billing_interval?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beta_access?: boolean
          beta_access_granted_at?: string | null
          beta_access_notes?: string | null
          billing_interval?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_parsing_cost: number
          ai_parsing_count: number
          attachment_count: number
          created_at: string
          equipment_count: number
          id: string
          month: string
          storage_bytes_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_parsing_cost?: number
          ai_parsing_count?: number
          attachment_count?: number
          created_at?: string
          equipment_count?: number
          id?: string
          month: string
          storage_bytes_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_parsing_cost?: number
          ai_parsing_count?: number
          attachment_count?: number
          created_at?: string
          equipment_count?: number
          id?: string
          month?: string
          storage_bytes_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
