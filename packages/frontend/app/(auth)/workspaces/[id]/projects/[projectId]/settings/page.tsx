'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Input } from '@/components/ui';

interface Status {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isClosed: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

// Sortable Status Item Component
function SortableStatusItem({
  status,
  isEditing,
  editingStatus,
  setEditingStatus,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  status: Status;
  isEditing: boolean;
  editingStatus: Status | null;
  setEditingStatus: (status: Status | null) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`p-3 ${isDragging ? 'ring-2 ring-primary-500' : ''}`}>
        {isEditing && editingStatus ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={editingStatus.color}
              onChange={(e) =>
                setEditingStatus({ ...editingStatus, color: e.target.value })
              }
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <Input
              value={editingStatus.name}
              onChange={(e) =>
                setEditingStatus({ ...editingStatus, name: e.target.value })
              }
              className="flex-1"
            />
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={editingStatus.isClosed}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, isClosed: e.target.checked })
                }
                className="rounded"
              />
              Closed
            </label>
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-white p-1 -ml-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: status.color }}
            />
            <span className="flex-1 font-medium">{status.name}</span>
            {status.isDefault && (
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">
                Default
              </span>
            )}
            {status.isClosed && (
              <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded">
                Closed
              </span>
            )}
            <button
              onClick={onEdit}
              className="text-slate-400 hover:text-white p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-slate-400 hover:text-red-400 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const projectId = params.projectId as string;

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'statuses' | 'labels'>('statuses');
  
  // New status form
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6b7280');
  const [newStatusIsClosed, setNewStatusIsClosed] = useState(false);
  const [addingStatus, setAddingStatus] = useState(false);

  // New label form
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6b7280');
  const [addingLabel, setAddingLabel] = useState(false);

  // Editing
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [projectId]);

  async function loadData() {
    setLoading(true);
    try {
      const [statusRes, labelRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/statuses`),
        fetch(`/api/projects/${projectId}/labels`),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatuses((data.data || []).sort((a: Status, b: Status) => a.position - b.position));
      }
      if (labelRes.ok) {
        const data = await labelRes.json();
        setLabels(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id);
      const newIndex = statuses.findIndex((s) => s.id === over.id);

      const newStatuses = arrayMove(statuses, oldIndex, newIndex);
      setStatuses(newStatuses);

      // Save new order to backend
      try {
        await fetch(`/api/projects/${projectId}/statuses/order`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statusIds: newStatuses.map((s) => s.id),
          }),
        });
      } catch (err) {
        console.error('Failed to reorder statuses:', err);
        loadData(); // Reload on error
      }
    }
  }

  async function handleAddStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    setAddingStatus(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStatusName,
          color: newStatusColor,
          isClosed: newStatusIsClosed,
        }),
      });

      if (res.ok) {
        setNewStatusName('');
        setNewStatusColor('#6b7280');
        setNewStatusIsClosed(false);
        loadData();
      }
    } finally {
      setAddingStatus(false);
    }
  }

  async function handleUpdateStatus(status: Status) {
    try {
      const res = await fetch(`/api/statuses/${status.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: status.name,
          color: status.color,
          isClosed: status.isClosed,
        }),
      });

      if (res.ok) {
        setEditingStatus(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleDeleteStatus(statusId: string) {
    if (!confirm('Are you sure you want to delete this status? Issues with this status will need to be moved.')) {
      return;
    }

    try {
      const res = await fetch(`/api/statuses/${statusId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete status:', err);
    }
  }

  async function handleAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    setAddingLabel(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLabelName,
          color: newLabelColor,
        }),
      });

      if (res.ok) {
        setNewLabelName('');
        setNewLabelColor('#6b7280');
        loadData();
      }
    } finally {
      setAddingLabel(false);
    }
  }

  async function handleDeleteLabel(labelId: string) {
    if (!confirm('Are you sure you want to delete this label?')) {
      return;
    }

    try {
      const res = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/workspaces/${workspaceId}/projects/${projectId}`}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Board
          </Link>
          <h1 className="text-2xl font-bold">Project Settings</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab('statuses')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'statuses'
              ? 'bg-white/5 text-white border-b-2 border-primary-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Columns / Statuses ({statuses.length})
        </button>
        <button
          onClick={() => setActiveTab('labels')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'labels'
              ? 'bg-white/5 text-white border-b-2 border-primary-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Labels ({labels.length})
        </button>
      </div>

      {/* Statuses Tab */}
      {activeTab === 'statuses' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Manage the columns on your Kanban board. Drag to reorder.
          </p>

          {/* Existing statuses with drag and drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={statuses.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {statuses.map((status) => (
                  <SortableStatusItem
                    key={status.id}
                    status={status}
                    isEditing={editingStatus?.id === status.id}
                    editingStatus={editingStatus}
                    setEditingStatus={setEditingStatus}
                    onEdit={() => setEditingStatus(status)}
                    onSave={() => editingStatus && handleUpdateStatus(editingStatus)}
                    onCancel={() => setEditingStatus(null)}
                    onDelete={() => handleDeleteStatus(status.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add new status */}
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-medium mb-3">Add New Column</h3>
            <form onSubmit={handleAddStatus} className="flex items-center gap-3">
              <input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
              <Input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Column name..."
                className="flex-1"
              />
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={newStatusIsClosed}
                  onChange={(e) => setNewStatusIsClosed(e.target.checked)}
                  className="rounded"
                />
                Closed
              </label>
              <Button type="submit" disabled={addingStatus || !newStatusName.trim()}>
                {addingStatus ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Manage labels to categorize your issues.
          </p>

          {/* Existing labels */}
          <div className="space-y-2">
            {labels.map((label) => (
              <Card key={label.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 rounded text-sm font-medium"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}40`,
                    }}
                  >
                    {label.name}
                  </span>
                  {label.description && (
                    <span className="text-sm text-slate-500 flex-1">{label.description}</span>
                  )}
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-slate-400 hover:text-red-400 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Add new label */}
          <Card className="p-4 mt-4">
            <h3 className="text-sm font-medium mb-3">Add New Label</h3>
            <form onSubmit={handleAddLabel} className="flex items-center gap-3">
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name..."
                className="flex-1"
              />
              <Button type="submit" disabled={addingLabel || !newLabelName.trim()}>
                {addingLabel ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
