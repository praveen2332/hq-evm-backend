export enum TaskStatusEnum {
  CREATED = 'created',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed', // failed, but can be retried
  TERMINATED = 'terminated' // when system got non-retryable error
}

export enum TaskSyncType {
  FULL = 'full',
  INCREMENTAL = 'incremental'
}
