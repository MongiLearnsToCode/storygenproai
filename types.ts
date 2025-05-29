
export interface Stage {
  id: string;
  name: string;
  description: string;
  userContent: string;
}

export interface StoryFramework {
  id: string;
  name: string;
  description: string;
  stages: Stage[];
}

export interface ActiveStory { // This might be deprecated in favor of Project
  frameworkId: string;
  stagesContent: Record<string, string>; // Keyed by stage.id
}

export enum AISuggestionType {
  EXPANSION = "expansion",
  SUGGESTIONS = "suggestions"
}

export enum AIOutputMode {
  CREATIVE = "creative", // Default narrative generation
  OUTLINE = "outline",   // Bullet-point outline
  PROMPT = "prompt"      // Guiding questions/prompts for the user to write
}

export interface Project {
  id: string; // Supabase UUID
  user_id: string; // Supabase auth user ID
  name: string; // User-defined or auto-generated
  frameworkid: string; // Supabase foreign key or identifier
  stagescontent: Record<string, string>; // Stored as JSONB in Supabase (was stagesContent)
  rawstoryidea?: string | null; // The initial raw idea if provided (was rawStoryIdea) - Allow null to match DB
  lastmodified: string; // ISO string from Supabase (timestamptz)
  createdat: string; // ISO string from Supabase (timestamptz)
}

export interface ProjectVersion {
  id: string; // Supabase UUID for the version record
  project_id: string; // FK to Project.id
  user_id: string; // Supabase auth user ID
  stagescontent: Record<string, string>;
  rawstoryidea?: string | null;
  version_name: string; // Description of what triggered this version
  created_at: string; // ISO string timestamp of when the version was created
}

export interface ToastMessage {
  id: string; // Unique ID for the toast
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // Optional: duration in ms for auto-dismissal
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro'
}

export interface AIUsageState {
  singleStageGenerations: number;
  clarifyingQuestions: number;
  fullStoryDrafters: number; // This limit applies to any mode of full story generation
  lastResetDate: string; // YYYY-MM-DD
}

export const AI_LIMITS = {
  [SubscriptionTier.FREE]: {
    singleStageGenerations: 5, // Applies to any mode of single stage generation
    clarifyingQuestions: 3,
    fullStoryDrafters: 0,    // Applies to any mode of full story generation
    projects: 3,
  },
  [SubscriptionTier.PRO]: {
    singleStageGenerations: 100,
    clarifyingQuestions: 50,
    fullStoryDrafters: 10,
    projects: Infinity,
  }
};

export interface UserProfile {
  id: string; // Should match auth.users.id
  display_name?: string | null;
  preferred_genres?: string[] | null;
  // Future fields for more detailed preferences:
  // personality?: string | null;
  // preferred_themes?: string[] | null;
  // writing_style?: string | null;
  // preferred_tone?: string | null;
  // language_preferences?: string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}
