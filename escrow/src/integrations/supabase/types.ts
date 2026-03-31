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
      escrow_attachments: {
        Row: {
          created_at: string
          escrow_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploader_address: string
        }
        Insert: {
          created_at?: string
          escrow_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploader_address: string
        }
        Update: {
          created_at?: string
          escrow_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploader_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_attachments_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrows"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_messages: {
        Row: {
          content: string
          created_at: string
          escrow_id: string
          id: string
          sender_address: string
        }
        Insert: {
          content: string
          created_at?: string
          escrow_id: string
          id?: string
          sender_address: string
        }
        Update: {
          content?: string
          created_at?: string
          escrow_id?: string
          id?: string
          sender_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_messages_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrows"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string
          escrow_id: string
          from_address: string
          id: string
          to_address: string | null
          tx_hash: string
          tx_type: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          escrow_id: string
          from_address: string
          id?: string
          to_address?: string | null
          tx_hash: string
          tx_type: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          escrow_id?: string
          from_address?: string
          id?: string
          to_address?: string | null
          tx_hash?: string
          tx_type?: Database["public"]["Enums"]["escrow_tx_type"]
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrows"
            referencedColumns: ["id"]
          },
        ]
      }
      escrows: {
        Row: {
          amount: number
          buyer_address: string
          buyer_signed_at: string | null
          buyer_user_id: string | null
          created_at: string
          datum_hash: string | null
          deadline: string
          description: string | null
          id: string
          last_synced_at: string | null
          on_chain_status: string | null
          pending_release_buyer_witness: string | null
          pending_release_script_witness: string | null
          pending_release_tx_cbor: string | null
          requires_multi_sig: boolean
          script_address: string | null
          seller_address: string
          seller_signed_at: string | null
          seller_user_id: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
          utxo_output_index: number | null
          utxo_tx_hash: string | null
          view_count: number | null
        }
        Insert: {
          amount: number
          buyer_address: string
          buyer_signed_at?: string | null
          buyer_user_id?: string | null
          created_at?: string
          datum_hash?: string | null
          deadline: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          on_chain_status?: string | null
          pending_release_buyer_witness?: string | null
          pending_release_script_witness?: string | null
          pending_release_tx_cbor?: string | null
          requires_multi_sig?: boolean
          script_address?: string | null
          seller_address: string
          seller_signed_at?: string | null
          seller_user_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
          utxo_output_index?: number | null
          utxo_tx_hash?: string | null
          view_count?: number | null
        }
        Update: {
          amount?: number
          buyer_address?: string
          buyer_signed_at?: string | null
          buyer_user_id?: string | null
          created_at?: string
          datum_hash?: string | null
          deadline?: string
          description?: string | null
          id?: string
          last_synced_at?: string | null
          on_chain_status?: string | null
          pending_release_buyer_witness?: string | null
          pending_release_script_witness?: string | null
          pending_release_tx_cbor?: string | null
          requires_multi_sig?: boolean
          script_address?: string | null
          seller_address?: string
          seller_signed_at?: string | null
          seller_user_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
          utxo_output_index?: number | null
          utxo_tx_hash?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
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
      escrow_status: "active" | "completed" | "refunded" | "disputed"
      escrow_tx_type: "funded" | "released" | "refunded"
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
      escrow_status: ["active", "completed", "refunded", "disputed"],
      escrow_tx_type: ["funded", "released", "refunded"],
    },
  },
} as const
