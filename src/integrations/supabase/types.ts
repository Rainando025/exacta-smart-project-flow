export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type AppRole = "admin" | "gestor" | "colaborador"

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: { id: string; title: string; content: string; author_id: string; pinned: boolean; created_at: string }
        Insert: { id?: string; title: string; content: string; author_id: string; pinned?: boolean; created_at?: string }
        Update: { id?: string; title?: string; content?: string; author_id?: string; pinned?: boolean; created_at?: string }
        Relationships: []
      }
      attachments: {
        Row: { id: string; file_name: string; storage_path: string; mime_type: string | null; file_size: number; uploaded_by: string; created_at: string; task_id: string | null; project_id: string | null; folder: string }
        Insert: { id?: string; file_name: string; storage_path: string; mime_type?: string | null; file_size?: number; uploaded_by: string; created_at?: string; task_id?: string | null; project_id?: string | null; folder?: string }
        Update: { id?: string; file_name?: string; storage_path?: string; mime_type?: string | null; file_size?: number; uploaded_by?: string; created_at?: string; task_id?: string | null; project_id?: string | null; folder?: string }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; entity_type: string; entity_id: string | null; action: string; actor_id: string | null; changes: Json | null; created_at: string }
        Insert: { id?: string; entity_type: string; entity_id?: string | null; action: string; actor_id?: string | null; changes?: Json | null; created_at?: string }
        Update: { id?: string; entity_type?: string; entity_id?: string | null; action?: string; actor_id?: string | null; changes?: Json | null; created_at?: string }
        Relationships: []
      }
      automations: {
        Row: { id: string; name: string; trigger_type: string; trigger_config: Json | null; action_type: string; action_config: Json | null; is_active: boolean | null; created_by: string; created_at: string }
        Insert: { id?: string; name: string; trigger_type: string; trigger_config?: Json | null; action_type: string; action_config?: Json | null; is_active?: boolean | null; created_by: string; created_at?: string }
        Update: { id?: string; name?: string; trigger_type?: string; trigger_config?: Json | null; action_type?: string; action_config?: Json | null; is_active?: boolean | null; created_by?: string; created_at?: string }
        Relationships: []
      }
      brainstorming_sessions: {
        Row: { id: string; title: string; description: string | null; created_by: string; created_at: string; updated_at: string; tags: string[] | null }
        Insert: { id?: string; title: string; description?: string | null; created_by: string; created_at?: string; updated_at?: string; tags?: string[] | null }
        Update: { id?: string; title?: string; description?: string | null; created_by?: string; created_at?: string; updated_at?: string; tags?: string[] | null }
        Relationships: []
      }
      documents: {
        Row: { id: string; title: string; content: string | null; type: string; owner_id: string; is_starred: boolean | null; data: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; content?: string | null; type?: string; owner_id: string; is_starred?: boolean | null; data?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; content?: string | null; type?: string; owner_id?: string; is_starred?: boolean | null; data?: Json | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      feedback_competencies: {
        Row: { id: string; feedback_id: string; name: string; score: number; created_at: string }
        Insert: { id?: string; feedback_id: string; name: string; score: number; created_at?: string }
        Update: { id?: string; feedback_id?: string; name?: string; score?: number; created_at?: string }
        Relationships: []
      }
      feedbacks: {
        Row: { id: string; reviewer_id: string; reviewee_id: string; feedback_type: string; rating: number; message: string | null; strengths: string | null; improvements: string | null; is_anonymous: boolean; created_at: string }
        Insert: { id?: string; reviewer_id: string; reviewee_id: string; feedback_type?: string; rating: number; message?: string | null; strengths?: string | null; improvements?: string | null; is_anonymous?: boolean; created_at?: string }
        Update: { id?: string; reviewer_id?: string; reviewee_id?: string; feedback_type?: string; rating?: number; message?: string | null; strengths?: string | null; improvements?: string | null; is_anonymous?: boolean; created_at?: string }
        Relationships: []
      }
      invitations: {
        Row: { id: string; email: string; token: string; role: AppRole; invited_by: string; status: string; expires_at: string; accepted_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; email: string; token?: string; role?: AppRole; invited_by: string; status?: string; expires_at?: string; accepted_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; email?: string; token?: string; role?: AppRole; invited_by?: string; status?: string; expires_at?: string; accepted_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      neural_edges: {
        Row: { id: string; user_id: string; is_team: boolean; source: string; target: string; created_at: string }
        Insert: { id?: string; user_id: string; is_team?: boolean; source: string; target: string; created_at?: string }
        Update: { id?: string; user_id?: string; is_team?: boolean; source?: string; target?: string; created_at?: string }
        Relationships: [
          {
            foreignKeyName: "neural_edges_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "neural_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neural_edges_target_fkey"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "neural_nodes"
            referencedColumns: ["id"]
          }
        ]
      }
      neural_nodes: {
        Row: { id: string; user_id: string; is_team: boolean; label: string; x: number; y: number; color: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; is_team?: boolean; label: string; x: number; y: number; color?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; is_team?: boolean; label?: string; x?: number; y?: number; color?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      notes: {
        Row: { id: string; user_id: string; title: string; content: string | null; color: string; pinned: boolean; priority: string; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title?: string; content?: string | null; color?: string; pinned?: boolean; priority?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; content?: string | null; color?: string; pinned?: boolean; priority?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; message: string | null; type: string; read: boolean; link: string | null; task_id: string | null; created_at: string }
        Insert: { id?: string; user_id: string; title: string; message?: string | null; type?: string; read?: boolean; link?: string | null; task_id?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; title?: string; message?: string | null; type?: string; read?: boolean; link?: string | null; task_id?: string | null; created_at?: string }
        Relationships: []
      }
      personal_finances: {
        Row: { id: string; user_id: string; title: string; amount: number; type: string; category: string; date: string; due_date: string | null; paid: boolean; recurring: string; installments: number; installment_number: number; parent_id: string | null; is_credit_card: boolean; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; amount?: number; type?: string; category?: string; date?: string; due_date?: string | null; paid?: boolean; recurring?: string; installments?: number; installment_number?: number; parent_id?: string | null; is_credit_card?: boolean; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; amount?: number; type?: string; category?: string; date?: string; due_date?: string | null; paid?: boolean; recurring?: string; installments?: number; installment_number?: number; parent_id?: string | null; is_credit_card?: boolean; notes?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; full_name: string; avatar_url: string | null; job_title: string | null; reminder_advance_minutes: number | null; reminder_snooze_minutes: number | null; skills: Json | null; created_at: string; updated_at: string }
        Insert: { id: string; full_name?: string; avatar_url?: string | null; job_title?: string | null; reminder_advance_minutes?: number | null; reminder_snooze_minutes?: number | null; skills?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string; avatar_url?: string | null; job_title?: string | null; reminder_advance_minutes?: number | null; reminder_snooze_minutes?: number | null; skills?: Json | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      projects: {
        Row: { id: string; name: string; description: string | null; owner_id: string; status: string; color: string; progress: number; due_date: string | null; start_date: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; description?: string | null; owner_id: string; status?: string; color?: string; progress?: number; due_date?: string | null; start_date?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; description?: string | null; owner_id?: string; status?: string; color?: string; progress?: number; due_date?: string | null; start_date?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      reminders: {
        Row: { id: string; user_id: string; title: string; description: string | null; remind_at: string; repeat: string; priority: string; completed: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; title: string; description?: string | null; remind_at: string; repeat?: string; priority?: string; completed?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; title?: string; description?: string | null; remind_at?: string; repeat?: string; priority?: string; completed?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      subtasks: {
        Row: { id: string; task_id: string; title: string; completed: boolean; position: number; created_by: string; created_at: string; updated_at: string }
        Insert: { id?: string; task_id: string; title: string; completed?: boolean; position?: number; created_by: string; created_at?: string; updated_at?: string }
        Update: { id?: string; task_id?: string; title?: string; completed?: boolean; position?: number; created_by?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      task_attachments: {
        Row: { id: string; task_id: string; file_name: string; file_path: string; file_type: string | null; uploaded_by: string; created_at: string; comment_id: string | null }
        Insert: { id?: string; task_id: string; file_name: string; file_path: string; file_type?: string | null; uploaded_by: string; created_at?: string; comment_id?: string | null }
        Update: { id?: string; task_id?: string; file_name?: string; file_path?: string; file_type?: string | null; uploaded_by?: string; created_at?: string; comment_id?: string | null }
        Relationships: []
      }
      task_comments: {
        Row: { id: string; task_id: string; user_id: string; content: string; created_at: string }
        Insert: { id?: string; task_id: string; user_id: string; content: string; created_at?: string }
        Update: { id?: string; task_id?: string; user_id?: string; content?: string; created_at?: string }
        Relationships: []
      }
      task_dependencies: {
        Row: { id: string; predecessor_id: string; successor_id: string; created_by: string; created_at: string }
        Insert: { id?: string; predecessor_id: string; successor_id: string; created_by: string; created_at?: string }
        Update: { id?: string; predecessor_id?: string; successor_id?: string; created_by?: string; created_at?: string }
        Relationships: []
      }
      tasks: {
        Row: { id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; start_date: string | null; creator_id: string; assignee_id: string | null; project_id: string | null; position: number; tags: string[] | null; completed_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; start_date?: string | null; creator_id: string; assignee_id?: string | null; project_id?: string | null; position?: number; tags?: string[] | null; completed_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; start_date?: string | null; creator_id?: string; assignee_id?: string | null; project_id?: string | null; position?: number; tags?: string[] | null; completed_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      time_logs: {
        Row: { id: string; user_id: string; task_id: string | null; start_time: string; end_time: string | null; duration: string | null; description: string | null; created_at: string }
        Insert: { id?: string; user_id: string; task_id?: string | null; start_time: string; end_time?: string | null; duration?: string | null; description?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; task_id?: string | null; start_time?: string; end_time?: string | null; duration?: string | null; description?: string | null; created_at?: string }
        Relationships: []
      }
      user_roles: {
        Row: { id: string; user_id: string; role: AppRole; created_at: string }
        Insert: { id?: string; user_id: string; role?: AppRole; created_at?: string }
        Update: { id?: string; user_id?: string; role?: AppRole; created_at?: string }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      has_role: { Args: { _user_id: string; _role: AppRole }; Returns: boolean }
      is_at_least: { Args: { _role: AppRole }; Returns: boolean }
    }
    Enums: {
      app_role: AppRole
    }
  }
}
