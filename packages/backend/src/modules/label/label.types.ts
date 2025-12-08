/**
 * Label domain types.
 */

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: Date;
}

export interface CreateLabelInput {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
  description?: string | null;
}

