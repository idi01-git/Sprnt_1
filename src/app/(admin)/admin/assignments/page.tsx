"use client";

import { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  CheckCircle,
  XCircle,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  dueDays: number;
  isActive: boolean;
}

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Assignment> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = () => {
    fetch('/api/admin/assignments')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssignments(data.data);
        }
        setLoading(false);
      });
  };

  const handleSave = async () => {
    if (!editing?.dayNumber || !editing?.title || !editing?.description) {
        alert('Please fill in all required fields');
        return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await response.json();
      if (data.success) {
        fetchAssignments();
        setEditing(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading assignments...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Assignment Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Configure daily assignments and deadlines.</p>
        </div>
        <button 
          onClick={() => setEditing({ dayNumber: assignments.length + 1, title: '', description: '', dueDays: 1, isActive: true })}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-poppins"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        DAY {assignment.dayNumber}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setEditing(assignment)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-3 mb-6 min-h-[4.5rem] leading-relaxed italic">
                {assignment.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Due in {assignment.dueDays} days
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-xs font-bold",
                    assignment.isActive ? "text-green-600" : "text-red-500"
                )}>
                    {assignment.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {assignment.isActive ? 'Active' : 'Draft'}
                </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                  {editing.id ? 'Edit Assignment' : 'New Assignment'}
              </h2>
              <button 
                onClick={() => setEditing(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Day Number</label>
                    <input 
                      type="number" 
                      value={editing.dayNumber}
                      onChange={(e) => setEditing({ ...editing, dayNumber: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Due Days</label>
                    <input 
                      type="number" 
                      value={editing.dueDays}
                      onChange={(e) => setEditing({ ...editing, dueDays: parseInt(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Title</label>
                <input 
                  type="text" 
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Design your first workflow"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
                <textarea 
                  rows={4}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Task details..."
                />
              </div>
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-200 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">Active and visible to students</label>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
              <button 
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900"
              >
                Discard
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Assignment
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
