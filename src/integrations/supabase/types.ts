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
      certificate_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          cause_of_death: string | null
          certificate_file_url: string | null
          certificate_number: string | null
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          child_birth_date: string | null
          child_birth_place: string | null
          child_name: string | null
          created_at: string
          death_date: string | null
          death_place: string | null
          deceased_name: string | null
          father_name: string | null
          husband_name: string | null
          id: string
          marriage_date: string | null
          marriage_place: string | null
          mother_name: string | null
          processed_at: string | null
          processed_by: string | null
          purpose: string
          remarks: string | null
          requestor_address: string | null
          requestor_contact: string | null
          requestor_name: string
          status: Database["public"]["Enums"]["request_status"]
          supporting_documents: string[] | null
          updated_at: string
          user_id: string
          wife_name: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          cause_of_death?: string | null
          certificate_file_url?: string | null
          certificate_number?: string | null
          certificate_type: Database["public"]["Enums"]["certificate_type"]
          child_birth_date?: string | null
          child_birth_place?: string | null
          child_name?: string | null
          created_at?: string
          death_date?: string | null
          death_place?: string | null
          deceased_name?: string | null
          father_name?: string | null
          husband_name?: string | null
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          mother_name?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose: string
          remarks?: string | null
          requestor_address?: string | null
          requestor_contact?: string | null
          requestor_name: string
          status?: Database["public"]["Enums"]["request_status"]
          supporting_documents?: string[] | null
          updated_at?: string
          user_id: string
          wife_name?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          cause_of_death?: string | null
          certificate_file_url?: string | null
          certificate_number?: string | null
          certificate_type?: Database["public"]["Enums"]["certificate_type"]
          child_birth_date?: string | null
          child_birth_place?: string | null
          child_name?: string | null
          created_at?: string
          death_date?: string | null
          death_place?: string | null
          deceased_name?: string | null
          father_name?: string | null
          husband_name?: string | null
          id?: string
          marriage_date?: string | null
          marriage_place?: string | null
          mother_name?: string | null
          processed_at?: string | null
          processed_by?: string | null
          purpose?: string
          remarks?: string | null
          requestor_address?: string | null
          requestor_contact?: string | null
          requestor_name?: string
          status?: Database["public"]["Enums"]["request_status"]
          supporting_documents?: string[] | null
          updated_at?: string
          user_id?: string
          wife_name?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string | null
          responded_at: string | null
          response: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          responded_at?: string | null
          response?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          responded_at?: string | null
          response?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_read_by: string[] | null
          message: string
          target_audience: string
          target_user_ids: string[] | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_read_by?: string[] | null
          message: string
          target_audience?: string
          target_user_ids?: string[] | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_read_by?: string[] | null
          message?: string
          target_audience?: string
          target_user_ids?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          barangay: string | null
          birth_date: string | null
          city: string | null
          civil_status: string | null
          created_at: string
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          province: string | null
          suffix: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          barangay?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          province?: string | null
          suffix?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          barangay?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          province?: string | null
          suffix?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      survey_answers: {
        Row: {
          answer_text: string | null
          answer_value: Json | null
          created_at: string
          id: string
          question_id: string
          response_id: string
        }
        Insert: {
          answer_text?: string | null
          answer_value?: Json | null
          created_at?: string
          id?: string
          question_id: string
          response_id: string
        }
        Update: {
          answer_text?: string | null
          answer_value?: Json | null
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          required: boolean | null
          survey_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text: string
          question_type: string
          required?: boolean | null
          survey_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          required?: boolean | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          id: string
          submitted_at: string
          survey_id: string
          user_id: string
        }
        Insert: {
          id?: string
          submitted_at?: string
          survey_id: string
          user_id: string
        }
        Update: {
          id?: string
          submitted_at?: string
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      is_captain_or_higher: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_higher: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "resident" | "staff" | "captain" | "admin" | "super_admin"
      certificate_type:
        | "birth"
        | "marriage"
        | "death"
        | "residency"
        | "indigency"
        | "clearance"
      request_status:
        | "pending"
        | "processing"
        | "approved"
        | "rejected"
        | "completed"
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
      app_role: ["resident", "staff", "captain", "admin", "super_admin"],
      certificate_type: [
        "birth",
        "marriage",
        "death",
        "residency",
        "indigency",
        "clearance",
      ],
      request_status: [
        "pending",
        "processing",
        "approved",
        "rejected",
        "completed",
      ],
    },
  },
} as const
