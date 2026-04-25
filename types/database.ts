// Hand-written to match supabase/migrations/0001_initial_schema.sql.
// Regenerate with `supabase gen types typescript --project-id <id>` once the
// Supabase CLI is connected.

export type UserRole = 'admin' | 'coach' | 'parent';
export type SessionStatus = 'scheduled' | 'held' | 'cancelled';
export type LkLevel = 'little_kicks' | 'junior' | 'mighty' | 'mega';

export type GroupScheduleEntry = {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  duration_minutes: number;
};

type Timestamp = string;
type UUID = string;

type WithTimestamps = {
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: UUID;
          name: string;
          timezone: string;
          contact_phone: string | null;
          contact_email: string | null;
          comms_responsible: UUID | null;
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          name: string;
          timezone?: string;
          contact_phone?: string | null;
          contact_email?: string | null;
          comms_responsible?: UUID | null;
        };
        Update: Partial<{
          name: string;
          timezone: string;
          contact_phone: string | null;
          contact_email: string | null;
          comms_responsible: UUID | null;
        }>;
      };
      profiles: {
        Row: {
          user_id: UUID;
          school_id: UUID;
          role: UserRole;
          full_name: string;
          phone: string | null;
        } & WithTimestamps;
        Insert: {
          user_id: UUID;
          school_id: UUID;
          role: UserRole;
          full_name: string;
          phone?: string | null;
        };
        Update: Partial<{
          school_id: UUID;
          role: UserRole;
          full_name: string;
          phone: string | null;
        }>;
      };
      groups: {
        Row: {
          id: UUID;
          school_id: UUID;
          coach_id: UUID | null;
          name: string;
          schedule: GroupScheduleEntry[];
          start_date: string | null;
          end_date: string | null;
          display_order: number;
          lk_level: LkLevel | null;
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          school_id: UUID;
          coach_id?: UUID | null;
          name: string;
          schedule?: GroupScheduleEntry[];
          start_date?: string | null;
          end_date?: string | null;
          display_order?: number;
          lk_level?: LkLevel | null;
        };
        Update: Partial<{
          coach_id: UUID | null;
          name: string;
          schedule: GroupScheduleEntry[];
          start_date: string | null;
          end_date: string | null;
          display_order: number;
          lk_level: LkLevel | null;
        }>;
      };
      students: {
        Row: {
          id: UUID;
          school_id: UUID;
          group_id: UUID | null;
          full_name: string;
          birth_date: string | null;
          photo_url: string | null;
          enrolled_at: string | null;
          left_at: string | null;
          dorsal_number: number | null;
          position: string | null;
          dominant_foot: 'left' | 'right' | 'both' | null;
          height_cm: number | null;
          weight_kg: number | null;
          english_vocab_known: string[];
          english_vocab_used: string[];
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          school_id: UUID;
          group_id?: UUID | null;
          full_name: string;
          birth_date?: string | null;
          photo_url?: string | null;
          enrolled_at?: string | null;
          left_at?: string | null;
          dorsal_number?: number | null;
          position?: string | null;
          dominant_foot?: 'left' | 'right' | 'both' | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          english_vocab_known?: string[];
          english_vocab_used?: string[];
        };
        Update: Partial<{
          group_id: UUID | null;
          full_name: string;
          birth_date: string | null;
          photo_url: string | null;
          enrolled_at: string | null;
          left_at: string | null;
          dorsal_number: number | null;
          position: string | null;
          dominant_foot: 'left' | 'right' | 'both' | null;
          height_cm: number | null;
          weight_kg: number | null;
          english_vocab_known: string[];
          english_vocab_used: string[];
        }>;
      };
      student_parents: {
        Row: {
          student_id: UUID;
          parent_user_id: UUID;
          relationship: string | null;
          created_at: Timestamp;
        };
        Insert: {
          student_id: UUID;
          parent_user_id: UUID;
          relationship?: string | null;
        };
        Update: Partial<{ relationship: string | null }>;
      };
      class_sessions: {
        Row: {
          id: UUID;
          group_id: UUID;
          scheduled_at: Timestamp;
          duration_minutes: number;
          status: SessionStatus;
          notes: string | null;
          target_vocabulary: string[];
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          group_id: UUID;
          scheduled_at: Timestamp;
          duration_minutes?: number;
          status?: SessionStatus;
          notes?: string | null;
          target_vocabulary?: string[];
        };
        Update: Partial<{
          scheduled_at: Timestamp;
          duration_minutes: number;
          status: SessionStatus;
          notes: string | null;
          target_vocabulary: string[];
        }>;
      };
      attendances: {
        Row: {
          id: UUID;
          session_id: UUID;
          student_id: UUID;
          present: boolean;
          coach_notes: string | null;
          mood: number | null;
          created_by: UUID;
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          session_id: UUID;
          student_id: UUID;
          present: boolean;
          coach_notes?: string | null;
          mood?: number | null;
          created_by: UUID;
        };
        Update: Partial<{
          present: boolean;
          coach_notes: string | null;
          mood: number | null;
        }>;
      };
      communications: {
        Row: {
          id: UUID;
          school_id: UUID;
          group_id: UUID | null;
          subject: string;
          content: string;
          sent_by: UUID;
          sent_at: Timestamp | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          school_id: UUID;
          group_id?: UUID | null;
          subject: string;
          content: string;
          sent_by: UUID;
          sent_at?: Timestamp | null;
        };
        Update: Partial<{
          subject: string;
          content: string;
          sent_at: Timestamp | null;
        }>;
      };
      communication_recipients: {
        Row: {
          communication_id: UUID;
          parent_user_id: UUID;
          delivered_at: Timestamp | null;
          read_at: Timestamp | null;
        };
        Insert: {
          communication_id: UUID;
          parent_user_id: UUID;
          delivered_at?: Timestamp | null;
          read_at?: Timestamp | null;
        };
        Update: Partial<{
          delivered_at: Timestamp | null;
          read_at: Timestamp | null;
        }>;
      };
      objectives: {
        Row: {
          id: UUID;
          group_id: UUID;
          title: string;
          description: string | null;
          display_order: number;
        } & WithTimestamps;
        Insert: {
          id?: UUID;
          group_id: UUID;
          title: string;
          description?: string | null;
          display_order?: number;
        };
        Update: Partial<{
          title: string;
          description: string | null;
          display_order: number;
        }>;
      };
      student_objectives: {
        Row: {
          student_id: UUID;
          objective_id: UUID;
          achieved_at: Timestamp;
          notes: string | null;
          marked_by: UUID | null;
        };
        Insert: {
          student_id: UUID;
          objective_id: UUID;
          achieved_at?: Timestamp;
          notes?: string | null;
          marked_by?: UUID | null;
        };
        Update: Partial<{
          achieved_at: Timestamp;
          notes: string | null;
        }>;
      };
      student_skills: {
        Row: {
          student_id: UUID;
          skill: string;
          value: number;
          notes: string | null;
          updated_by: UUID | null;
          updated_at: Timestamp;
        };
        Insert: {
          student_id: UUID;
          skill: string;
          value: number;
          notes?: string | null;
          updated_by?: UUID | null;
        };
        Update: Partial<{
          value: number;
          notes: string | null;
          updated_by: UUID | null;
        }>;
      };
      student_skill_snapshots: {
        Row: {
          student_id: UUID;
          captured_month: string; // YYYY-MM-01
          skill: string;
          value: number;
          captured_by: UUID | null;
          captured_at: Timestamp;
        };
        Insert: {
          student_id: UUID;
          captured_month: string;
          skill: string;
          value: number;
          captured_by?: UUID | null;
        };
        Update: Partial<{
          value: number;
          captured_by: UUID | null;
        }>;
      };
      invitations: {
        Row: {
          id: UUID;
          school_id: UUID;
          email: string;
          role: UserRole;
          full_name: string;
          student_id: UUID | null;
          token: string;
          expires_at: Timestamp;
          accepted_at: Timestamp | null;
          created_by: UUID;
          created_at: Timestamp;
        };
        Insert: {
          id?: UUID;
          school_id: UUID;
          email: string;
          role: UserRole;
          full_name: string;
          student_id?: UUID | null;
          token: string;
          expires_at?: Timestamp;
          created_by: UUID;
        };
        Update: Partial<{
          accepted_at: Timestamp | null;
          expires_at: Timestamp;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole | null;
      };
      current_user_school_id: {
        Args: Record<string, never>;
        Returns: UUID | null;
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
