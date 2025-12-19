'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, useToast } from '@/components/ui';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const { addToast } = useToast();
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; image: string | null } | null>(null);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await api.auth.me();
      setUser(data);
      setName(data.name || '');
      setImage(data.image || '');
    } catch (err) {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.updateProfile({ name, image: image || null });
      addToast('Profile updated successfully', 'success');
      // Update local state or trigger a reload if needed
      if (user) {
        setUser({ ...user, name, image: image || null });
      }
      // Force reload to update navigation bar
      window.location.reload();
    } catch (err) {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in">
      <header>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-zinc-500">Manage your personal information and how others see you.</p>
      </header>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name and profile picture.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {image ? (
                    <img src={image} alt="Avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center text-2xl font-bold text-zinc-900">
                      {(name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    label="Email Address"
                    value={user?.email || ''}
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-600">Email cannot be changed.</p>
                </div>
              </div>

              <div className="grid gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Profile Image URL"
                  placeholder="https://example.com/avatar.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={saving}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-500/10 bg-red-500/[0.02]">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription>Actions that cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="danger" disabled>
              Delete Account
            </Button>
            <p className="mt-2 text-xs text-zinc-600">Account deletion is not yet available.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

