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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          anon_id: string | null
          created_at: string
          id: string
          last_message_at: string
          unread_admin: number
          unread_user: number
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          unread_admin?: number
          unread_user?: number
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          unread_admin?: number
          unread_user?: number
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_leads: {
        Row: {
          created_at: string
          handled: boolean
          id: string
          message: string
          name: string
          phone: string
          source: string
        }
        Insert: {
          created_at?: string
          handled?: boolean
          id?: string
          message: string
          name: string
          phone: string
          source?: string
        }
        Update: {
          created_at?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string
          source?: string
        }
        Relationships: []
      }
      distributor_plans: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      distributors: {
        Row: {
          avatar_url: string | null
          candidate_referrals: number
          created_at: string
          display_name: string | null
          id: string
          paid_amount: number
          password: string
          pending_amount: number
          plan_id: string | null
          referred_by: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          candidate_referrals?: number
          created_at?: string
          display_name?: string | null
          id?: string
          paid_amount?: number
          password: string
          pending_amount?: number
          plan_id?: string | null
          referred_by?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          candidate_referrals?: number
          created_at?: string
          display_name?: string | null
          id?: string
          paid_amount?: number
          password?: string
          pending_amount?: number
          plan_id?: string | null
          referred_by?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "distributors_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "distributor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          referral_code: string | null
          shipping_address: string
          shipping_city: string
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          referral_code?: string | null
          shipping_address: string
          shipping_city: string
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          referral_code?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean
          gallery: Json | null
          id: string
          image_url: string | null
          images: string[]
          is_new: boolean
          name: string
          price: number
          sale_price: number | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json | null
          id?: string
          image_url?: string | null
          images?: string[]
          is_new?: boolean
          name: string
          price: number
          sale_price?: number | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          gallery?: Json | null
          id?: string
          image_url?: string | null
          images?: string[]
          is_new?: boolean
          name?: string
          price?: number
          sale_price?: number | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          comment: string | null
          created_at: string
          id: string
          media: Json
          product_id: string
          rating: number
          title: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          media?: Json
          product_id: string
          rating: number
          title?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          approved?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          media?: Json
          product_id?: string
          rating?: number
          title?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          announcement: string | null
          business_city: string
          contact_email: string | null
          contact_phone: string
          facebook_url: string | null
          hero_headline: string | null
          hero_subtext: string | null
          id: number
          instagram_url: string | null
          return_policy: string | null
          shipping_fee: number
          shipping_fee_lahore: number
          shipping_fee_other: number
          site_name: string
          tiktok_url: string | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          announcement?: string | null
          business_city?: string
          contact_email?: string | null
          contact_phone?: string
          facebook_url?: string | null
          hero_headline?: string | null
          hero_subtext?: string | null
          id?: number
          instagram_url?: string | null
          return_policy?: string | null
          shipping_fee?: number
          shipping_fee_lahore?: number
          shipping_fee_other?: number
          site_name?: string
          tiktok_url?: string | null
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          announcement?: string | null
          business_city?: string
          contact_email?: string | null
          contact_phone?: string
          facebook_url?: string | null
          hero_headline?: string | null
          hero_subtext?: string | null
          id?: number
          instagram_url?: string | null
          return_policy?: string | null
          shipping_fee?: number
          shipping_fee_lahore?: number
          shipping_fee_other?: number
          site_name?: string
          tiktok_url?: string | null
          updated_at?: string
          whatsapp_number?: string
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
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_distributor: {
        Args: { p_password: string; p_username: string }
        Returns: {
          avatar_url: string
          candidate_referrals: number
          display_name: string
          id: string
          paid_amount: number
          pending_amount: number
          plan_id: string
          username: string
        }[]
      }
      get_distributor_stats: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          candidate_referrals: number
          commission_percent: number
          display_name: string
          paid_amount: number
          pending_amount: number
          plan_name: string
          sales_count: number
          total_commission: number
          username: string
        }[]
      }
      get_distributor_team: {
        Args: { p_username: string }
        Returns: {
          avatar_url: string
          commission_percent: number
          display_name: string
          joined_at: string
          orders_count: number
          plan_name: string
          revenue: number
          sub_team_count: number
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_order: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          created_at: string
          customer_name: string
          order_number: string
          shipping_address: string
          shipping_city: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
        }[]
      }
      update_distributor_profile: {
        Args: {
          p_avatar_url: string
          p_display_name: string
          p_password: string
          p_username: string
        }
        Returns: {
          avatar_url: string
          display_name: string
          username: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "active" | "draft" | "archived"
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
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["active", "draft", "archived"],
    },
  },
} as const
