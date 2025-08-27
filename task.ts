export interface Task {
    id: string;
    title: string;
    description?: string;
    deadline: Date;
    isPublic: boolean;
    isCompleted: boolean;
    createdAt: Date;
    completedAt?: Date;
    userId: string;
    watchers: string[]; // Array of user IDs watching this task
    tags?: string[];
  }
  
  export interface CreateTaskData {
    title: string;
    description?: string;
    deadline: Date;
    isPublic: boolean;
    tags?: string[];
  }
  
  export interface TaskUpdateData {
    title?: string;
    description?: string;
    deadline?: Date;
    isPublic?: boolean;
    isCompleted?: boolean;
    tags?: string[];
  }