import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Task, CreateTaskData, TaskUpdateData } from '../types/task';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: TaskUpdateData } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string };

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'TOGGLE_TASK_COMPLETION':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                isCompleted: !task.isCompleted,
                completedAt: !task.isCompleted ? new Date() : undefined,
              }
            : task
        ),
      };
    default:
      return state;
  }
};

interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  createTask: (taskData: CreateTaskData) => Promise<void>;
  updateTask: (id: string, updates: TaskUpdateData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const createTask = async (taskData: CreateTaskData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // For now, we'll use local storage. Later this will be an API call
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData,
        isCompleted: false,
        createdAt: new Date(),
        userId: 'current-user-id', // This will come from auth context later
        watchers: [],
      };

      // Save to local storage
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = [...existingTasks, newTask];
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));

      dispatch({ type: 'ADD_TASK', payload: newTask });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create task' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTask = async (id: string, updates: TaskUpdateData): Promise<void> => {
    try {
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
      
      // Update local storage
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = existingTasks.map((task: Task) =>
        task.id === id ? { ...task, ...updates } : task
      );
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'DELETE_TASK', payload: id });
      
      // Update local storage
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = existingTasks.filter((task: Task) => task.id !== id);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  };

  const toggleTaskCompletion = async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id });
      
      // Update local storage
      const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const updatedTasks = existingTasks.map((task: Task) => {
        if (task.id === id) {
          return {
            ...task,
            isCompleted: !task.isCompleted,
            completedAt: !task.isCompleted ? new Date() : undefined,
          };
        }
        return task;
      });
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to toggle task completion' });
    }
  };

  const value: TaskContextType = {
    state,
    dispatch,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};