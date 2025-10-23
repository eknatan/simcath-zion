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
      applicants: {
        Row: {
          case_type: string
          created_at: string | null
          email_sent_to_secretary: boolean | null
          form_data: Json
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          case_type: string
          created_at?: string | null
          email_sent_to_secretary?: boolean | null
          form_data: Json
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          case_type?: string
          created_at?: string | null
          email_sent_to_secretary?: boolean | null
          form_data?: Json
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_number: string
          branch: string
          case_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_number: string
          branch: string
          case_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_number?: string
          branch?: string
          case_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_details_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_history: {
        Row: {
          case_id: string
          changed_at: string | null
          changed_by: string | null
          field_changed: string | null
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
        }
        Insert: {
          case_id: string
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Update: {
          case_id?: string
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          address: string | null
          applicant_id: string | null
          bride_background: string | null
          bride_father_name: string | null
          bride_first_name: string | null
          bride_id: string | null
          bride_last_name: string | null
          bride_memorial_day: string | null
          bride_mother_name: string | null
          bride_school: string | null
          case_number: number
          case_type: string
          child_name: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_phone2: string | null
          contact_phone3: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          end_reason: string | null
          family_name: string | null
          groom_background: string | null
          groom_father_name: string | null
          groom_first_name: string | null
          groom_id: string | null
          groom_last_name: string | null
          groom_memorial_day: string | null
          groom_mother_name: string | null
          groom_school: string | null
          guests_count: number | null
          id: string
          parent1_id: string | null
          parent1_name: string | null
          parent2_id: string | null
          parent2_name: string | null
          raw_form_json: Json | null
          start_date: string | null
          status: string
          total_cost: number | null
          updated_at: string | null
          venue: string | null
          wedding_date_gregorian: string | null
          wedding_date_hebrew: string | null
        }
        Insert: {
          address?: string | null
          applicant_id?: string | null
          bride_background?: string | null
          bride_father_name?: string | null
          bride_first_name?: string | null
          bride_id?: string | null
          bride_last_name?: string | null
          bride_memorial_day?: string | null
          bride_mother_name?: string | null
          bride_school?: string | null
          case_number?: number
          case_type: string
          child_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone2?: string | null
          contact_phone3?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          end_reason?: string | null
          family_name?: string | null
          groom_background?: string | null
          groom_father_name?: string | null
          groom_first_name?: string | null
          groom_id?: string | null
          groom_last_name?: string | null
          groom_memorial_day?: string | null
          groom_mother_name?: string | null
          groom_school?: string | null
          guests_count?: number | null
          id?: string
          parent1_id?: string | null
          parent1_name?: string | null
          parent2_id?: string | null
          parent2_name?: string | null
          raw_form_json?: Json | null
          start_date?: string | null
          status: string
          total_cost?: number | null
          updated_at?: string | null
          venue?: string | null
          wedding_date_gregorian?: string | null
          wedding_date_hebrew?: string | null
        }
        Update: {
          address?: string | null
          applicant_id?: string | null
          bride_background?: string | null
          bride_father_name?: string | null
          bride_first_name?: string | null
          bride_id?: string | null
          bride_last_name?: string | null
          bride_memorial_day?: string | null
          bride_mother_name?: string | null
          bride_school?: string | null
          case_number?: number
          case_type?: string
          child_name?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone2?: string | null
          contact_phone3?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          end_reason?: string | null
          family_name?: string | null
          groom_background?: string | null
          groom_father_name?: string | null
          groom_first_name?: string | null
          groom_id?: string | null
          groom_last_name?: string | null
          groom_memorial_day?: string | null
          groom_mother_name?: string | null
          groom_school?: string | null
          guests_count?: number | null
          id?: string
          parent1_id?: string | null
          parent1_name?: string | null
          parent2_id?: string | null
          parent2_name?: string | null
          raw_form_json?: Json | null
          start_date?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string | null
          venue?: string | null
          wedding_date_gregorian?: string | null
          wedding_date_hebrew?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          case_id: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          case_id?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          case_id?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          case_id: string
          file_type: string
          filename: string
          id: string
          path_or_url: string
          size_bytes: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          file_type: string
          filename: string
          id?: string
          path_or_url: string
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          file_type?: string
          filename?: string
          id?: string
          path_or_url?: string
          size_bytes?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_ils: number
          amount_usd: number | null
          approved_amount: number | null
          approved_by: string | null
          case_id: string
          created_at: string | null
          exchange_rate: number | null
          id: string
          notes: string | null
          payment_month: string | null
          payment_type: string
          receipt_reference: string | null
          status: string
          transferred_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount_ils: number
          amount_usd?: number | null
          approved_amount?: number | null
          approved_by?: string | null
          case_id: string
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          payment_month?: string | null
          payment_type: string
          receipt_reference?: string | null
          status?: string
          transferred_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_ils?: number
          amount_usd?: number | null
          approved_amount?: number | null
          approved_by?: string | null
          case_id?: string
          created_at?: string | null
          exchange_rate?: number | null
          id?: string
          notes?: string | null
          payment_month?: string | null
          payment_type?: string
          receipt_reference?: string | null
          status?: string
          transferred_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transfers_export: {
        Row: {
          cases_included: Json
          export_type: string
          exported_at: string | null
          exported_by: string | null
          file_url: string | null
          filename: string | null
          id: string
          total_amount: number
          total_count: number
        }
        Insert: {
          cases_included: Json
          export_type: string
          exported_at?: string | null
          exported_by?: string | null
          file_url?: string | null
          filename?: string | null
          id?: string
          total_amount: number
          total_count: number
        }
        Update: {
          cases_included?: Json
          export_type?: string
          exported_at?: string | null
          exported_by?: string | null
          file_url?: string | null
          filename?: string | null
          id?: string
          total_amount?: number
          total_count?: number
        }
        Relationships: []
      }
      translations: {
        Row: {
          case_id: string
          content_json: Json
          created_at: string | null
          edited_by_user: boolean | null
          id: string
          lang_from: string | null
          lang_to: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          case_id: string
          content_json: Json
          created_at?: string | null
          edited_by_user?: boolean | null
          id?: string
          lang_from?: string | null
          lang_to: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          content_json?: Json
          created_at?: string | null
          edited_by_user?: boolean | null
          id?: string
          lang_from?: string | null
          lang_to?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          performed_by: string | null
          target_user_email: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          performed_by?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          performed_by?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
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
