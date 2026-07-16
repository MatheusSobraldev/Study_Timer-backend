export interface StudySession {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  durationInMinutes: number;
  startedAt: Date;
  finishedAt: Date;
  notes?: string;
  createdAt: Date;
}

export interface StudySessionDatabaseRow {
  id: string;
  user_id: string;
  title: string;
  subject?: string | null;
  duration_in_minutes: number;
  started_at: Date;
  finished_at: Date;
  notes?: string | null;
  created_at: Date;
}

export function mapStudySessionFromDatabase(
  row: StudySessionDatabaseRow
): StudySession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subject: row.subject ?? undefined,
    durationInMinutes: row.duration_in_minutes,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  };
}
