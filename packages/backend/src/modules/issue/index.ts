export { IssueRepository } from './issue.repository.js';
export type { IIssueRepository } from './issue.repository.js';

export { IssueService } from './issue.service.js';
export type { IIssueService } from './issue.service.js';

export { IssueController } from './issue.controller.js';
export { createIssueRoutes } from './issue.routes.js';

export type {
  Issue,
  IssueWithDetails,
  IssuePriority,
  Comment,
  CommentWithAuthor,
  IssueHistoryEntry,
  CreateIssueInput,
  UpdateIssueInput,
  CreateCommentInput,
  UpdateCommentInput,
  IssueFilters,
} from './issue.types.js';

