export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
        }
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          folder: string
          id: string
          mime_type: string | null
          project_id: string | null
          storage_path: string
          task_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number
          folder?: string
          id?: string
          mime_type?: string | null
          project_id?: string | null
          storage_path: string
          task_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          folder?: string
          id?: string
          mime_type?: string | null
          project_id?: string | null
          storage_path?: string
          task_id?: string | null
          uploaded_by?: string
        }
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
      }
      automations: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json | null
          trigger_type: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config?: Json | null
          trigger_type: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json | null
          trigger_type?: string
        }
      }
      brainstorming_sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          is_starred: boolean | null
          owner_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_starred?: boolean | null
          owner_id: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_starred?: boolean | null
          owner_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
      }
      feedback_competencies: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          name: string
          score: number
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          name: string
          score: number
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          name?: string
          score?: number
        }
      }
      feedbacks: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          improvements: string | null
          is_anonymous: boolean
          message: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          strengths: string | null
        }
        Insert: {
          created_at?: string
          feedback_type?: string
          id?: string
          improvements?: string | null
          is_anonymous?: boolean
          message?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          strengths?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          improvements?: string | null
          is_anonymous?: boolean
          message?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          strengths?: string | null
        }
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          color: string
          content: string | null
          created_at: string
          id: string
          pinned: boolean
          priority: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          priority?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          priority?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          task_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
      }
      personal_finances: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          due_date: string | null
          id: string
          installment_number: number
          installments: number
          is_credit_card: boolean
          notes: string | null
          paid: boolean
          parent_id: string | null
          recurring: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          installments?: number
          is_credit_card?: boolean
          notes?: string | null
          paid?: boolean
          parent_id?: string | null
          recurring?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          installments?: number
          is_credit_card?: boolean
          notes?: string | null
          paid?: boolean
          parent_id?: string | null
          recurring?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          owner_id: string
          progress: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          owner_id: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          owner_id?: string
          progress?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          id: string
          priority: string
          remind_at: string
          repeat: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          remind_at: string
          repeat?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          remind_at?: string
          repeat?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
      }
      subtasks: {
        Row: {
          completed: boolean
          created_at: string
          created_by: string
          id: string
          position: number
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          created_by: string
          id?: string
          position?: number
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          created_by?: string
          id?: string
          position?: number
          task_id?: string
          title?: string
          updated_at?: string
        }
      }
      task_attachments: {
        Row: {
          comment_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          task_id?: string
          uploaded_by?: string
        }
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
      }
      task_dependencies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          predecessor_id: string
          successor_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          predecessor_id: string
          successor_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          predecessor_id?: string
          successor_id?: string
        }
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string
          project_id: string | null
          start_date: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          project_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
      }
      time_logs: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          end_time: string | null
          id: string
          start_time: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          start_time?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          end_time?: string | null
          id?: string
          start_time?: string
          task_id?: string | null
          user_id?: string
        }
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
      }
    }
    Views: {
      [_ in string]: {
        Row: {
          [_ in string]: Json | null
        }
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_at_least: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "colaborador"
    }
    CompositeTypes: {
      [_ in string]: string[]
    }
  }
}
