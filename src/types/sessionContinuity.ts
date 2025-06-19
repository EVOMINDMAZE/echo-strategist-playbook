
export interface ContinuableSession {
  id: string;
  target_name: string;
  target_id: string;
  last_activity: string;
  message_count: number;
  status: string;
  can_continue: boolean;
  continuation_reason: string;
}
