/**
 * Operations Command Center Types
 * Housekeeping, maintenance, and staff management
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskType = 'housekeeping' | 'maintenance' | 'inspection' | 'delivery';

export interface Room {
  number: string;
  floor: number;
  type: string;
  status: 'occupied' | 'vacant' | 'dirty' | 'clean' | 'maintenance';
  lastCleaned?: Date;
  nextCheckout?: Date;
  nextCheckin?: Date;
}

export interface Task {
  id: string;
  type: TaskType;
  roomNumber: string;
  floor: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  estimatedDuration: number; // minutes
  createdAt: Date;
  dueAt?: Date;
  completedAt?: Date;
  notes?: string[];
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  currentFloor?: number;
  tasksAssigned: number;
  tasksCompleted: number;
  efficiency: number; // 0-1
  available: boolean;
}

export interface Route {
  staffId: string;
  tasks: Task[];
  totalDuration: number; // minutes
  totalDistance: number; // floors traveled
  efficiency: number; // 0-1
}

export interface OperationsMetrics {
  totalRooms: number;
  cleanRooms: number;
  dirtyRooms: number;
  inProgress: number;
  overdue: number;
  avgCleaningTime: number;
  staffUtilization: number;
  estimatedCompletion: Date;
}
