export interface City {
  id: string;
  name: string;
  nameAr?: string;
  name_ar?: string; // Standardize for API compatibility if needed
  coords: [number, number];
  description: string;
  soundCategory?: MonumentSoundCategory;
}

export type MonumentSoundCategory = "coastal" | "medina" | "desert" | "nature";

export interface Monument {
  id: string;
  cityId: string;
  name: string;
  nameAr?: string;
  name_ar?: string; // Standardize for API compatibility if needed
  coords: [number, number];
  description: string;
  imageUrl: string;
  modelUrl?: string;
  history?: string;
  architecture?: string;
  period?: string;
  soundCategory?: MonumentSoundCategory;
  city_ar?: string;
  city_en?: string;
}

export interface QuizQuestion {
  id: string; // unique_hash
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  confidence_score?: number; // 0.0-1.0
  source?: "AI" | "database" | "hybrid";
  category?: "geography" | "history" | "culture";
}

export interface ScoreBoardEntry {
  userId: string;
  name: string;
  score: number;
  date: string;
  gamesPlayed?: number;
  lastUpdated?: number;
}

export type GameMode = "login" | "idle" | "exploration" | "quiz" | "defi" | "leaderboard";

export type Difficulty = "easy" | "medium" | "hard";

export interface QuizDifficultySettings {
  label: string;
  questions: number;
  time: number;
  multiplier: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface GameState {
  mode: GameMode;
  score: number;
  unlockedMonuments: string[]; // for tracking exploration
  completedQuiz: boolean;
  currentUser: UserProfile | null;
  lang: "ar" | "en";
}
