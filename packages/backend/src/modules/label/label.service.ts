import { NotFoundError } from '../../core/errors/errors.js';
import type { ILabelRepository } from './label.repository.js';
import type { Label, CreateLabelInput, UpdateLabelInput } from './label.types.js';

/**
 * Label service interface.
 */
export interface ILabelService {
  getLabel(id: string): Promise<Label>;
  getProjectLabels(projectId: string): Promise<Label[]>;
  createLabel(projectId: string, input: CreateLabelInput): Promise<Label>;
  updateLabel(id: string, input: UpdateLabelInput): Promise<Label>;
  deleteLabel(id: string): Promise<void>;
}

/**
 * Label service implementation.
 */
export class LabelService implements ILabelService {
  constructor(private labelRepository: ILabelRepository) {}

  async getLabel(id: string): Promise<Label> {
    const label = await this.labelRepository.findById(id);
    if (!label) {
      throw new NotFoundError('Label', id);
    }
    return label;
  }

  async getProjectLabels(projectId: string): Promise<Label[]> {
    return this.labelRepository.findByProjectId(projectId);
  }

  async createLabel(projectId: string, input: CreateLabelInput): Promise<Label> {
    return this.labelRepository.create(projectId, input);
  }

  async updateLabel(id: string, input: UpdateLabelInput): Promise<Label> {
    const existing = await this.labelRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Label', id);
    }
    return this.labelRepository.update(id, input);
  }

  async deleteLabel(id: string): Promise<void> {
    const existing = await this.labelRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Label', id);
    }
    await this.labelRepository.delete(id);
  }
}

