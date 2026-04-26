export interface OccurrenceData {
  id: string;
  section: string;
  item: string;
  comment: string;
  photos: string[];
  reporter: string;
  time: string;
  created_at?: string;
}

export interface ChecklistEntry {
  item_key: string;
  is_checked: boolean;
  reporter?: string;
  checked_at?: string;
  updated_at?: string;
}

export interface ChecklistSession {
  id: string;
  reporter: string;
  machine: string;
  shift: string;
  submitted_at: string;
  items: { key: string; checked: boolean }[];
}
