'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui';

interface Props {
  workspaceId: string;
  workspaceName: string;
}

export function DeleteWorkspaceButton({ workspaceId, workspaceName }: Props) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }

      router.push('/workspaces');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Delete "{workspaceName}"?</span>
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          isLoading={isLoading}
        >
          Yes, delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" onClick={() => setIsConfirming(true)}>
      Delete
    </Button>
  );
}

