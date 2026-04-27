import { cycles } from '../../schema.js';

export interface CycleRow {
  id: string;
  name: string;
  status: string;
  goal: string | null;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
}

export const CYCLE_COLUMNS = {
  id: cycles.id,
  name: cycles.name,
  status: cycles.status,
  goal: cycles.goal,
  starts_at: cycles.starts_at,
  ends_at: cycles.ends_at,
  created_at: cycles.created_at,
};
