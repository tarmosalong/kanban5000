export interface IssueStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  status: {
    id: string;
    name: string;
    color: string;
  };
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  labelDetails: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  dueDate: string | null;
  createdAt: string;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  issues: Issue[];
}
