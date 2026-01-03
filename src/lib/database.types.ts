export type UserRole = 'buyer' | 'supplier' | 'admin' | 'commercial';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          role: UserRole;
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          role?: UserRole;
          first_name: string;
          last_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          role?: UserRole;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          supplier_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          sku: string | null;
          price_per_unit: number;
          unit: string;
          moq: number;
          stock_quantity: number;
          available: boolean;
          featured: boolean;
          origin_country: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          display_order: number;
          active: boolean;
          created_at: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
    };
  };
}
