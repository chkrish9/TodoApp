import { useTodoStore } from '../../stores/todoStore';
import { X, Bell, Trash } from 'lucide-react';
import type { Task, CustomField } from '../../types/todo';
import { CustomFieldsRenderer } from './CustomFieldsRenderer';
import { CustomFieldManager } from './CustomFieldManager';

export function TaskDetail() {
    const { tasks, activeTaskId, setActiveTask, updateTask, deleteTask } = useTodoStore();
    const task = tasks.find((t) => t.id === activeTaskId);

    if (!task) return null;

    const handleUpdate = (updates: Partial<Task>) => {
        updateTask(task.id, updates);
    };

    const handleFieldUpdate = (fieldId: string, newValue: any) => {
        const updatedFields = task.customFieldValues.map(f =>
            f.id === fieldId ? { ...f, value: newValue } : f
        );
        handleUpdate({ customFieldValues: updatedFields });
    };

    const handleFieldDelete = (fieldId: string) => {
        const updatedFields = task.customFieldValues.filter(f => f.id !== fieldId);
        handleUpdate({ customFieldValues: updatedFields });
    };

    const handleFieldsListUpdate = (newFields: CustomField[]) => {
        handleUpdate({ customFieldValues: newFields });
    };

    return (
        <div className="w-full md:w-[400px] border-l border-border bg-background h-full overflow-y-auto flex flex-col p-6 shadow-xl z-20 absolute right-0 top-0 bottom-0 animate-in slide-in-from-right-10 duration-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg text-foreground">Task Details</h2>
                <button onClick={() => setActiveTask(null)} className="hover:bg-muted p-1 rounded transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <div className="space-y-6 flex-1">
                {/* Title */}
                <div className="space-y-2">
                    <textarea
                        value={task.title}
                        onChange={(e) => handleUpdate({ title: e.target.value })}
                        className="w-full bg-transparent border-none p-0 text-xl font-bold focus:outline-none focus:ring-0 resize-none"
                        placeholder="Task title"
                        rows={2}
                    />
                </div>

                {/* Date & Reminder */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                            onChange={(e) => handleUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                            className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Bell className="w-4 h-4 text-primary" />
                            <span>Reminders</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={task.reminderEnabled}
                            onChange={(e) => handleUpdate({ reminderEnabled: e.target.checked })}
                            className="accent-primary w-4 h-4"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
                    <textarea
                        placeholder="Add notes..."
                        value={task.description || ''}
                        onChange={(e) => handleUpdate({ description: e.target.value })}
                        className="w-full bg-muted/30 border border-border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
                    />
                </div>

                {/* Custom Fields */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Custom Fields</label>

                    <CustomFieldsRenderer
                        fields={task.customFieldValues || []}
                        onFieldUpdate={handleFieldUpdate}
                        onFieldDelete={handleFieldDelete}
                    />

                    <CustomFieldManager
                        task={task}
                        onUpdate={handleFieldsListUpdate}
                    />
                </div>
            </div>

            <div className="pt-6 mt-auto border-t border-border">
                <button
                    onClick={() => {
                        deleteTask(task.id);
                        // setActiveTask(null); // Already handled in store logic but good to double check
                    }}
                    className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors text-sm font-medium"
                >
                    <Trash className="w-4 h-4" />
                    Delete Task
                </button>
            </div>
        </div>
    );
}
