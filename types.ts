
export interface Staff {
  id: string;
  name: string;
  avatar: string;
  tag?: string;
}

export interface WorkItem {
  id: string;
  label: string;
  color: string;
}

export interface ScheduleCell {
  staffId: string;
  timeSlot: number;
  workId?: string;
}

export type SelectionState = {
  staffId: string;
  timeSlot: number;
} | null;
