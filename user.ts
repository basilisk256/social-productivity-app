export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    joinDate: Date;
    totalTasksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    avatar?: string;
    totalTasksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  }