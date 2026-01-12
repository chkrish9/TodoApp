import React, { useState } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { TaskItem } from './TaskItem';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export function TaskList() {
    const { tasks, activeGroupId, groups, addTask } = useTodoStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

    const activeGroup = groups.find(g => g.id === activeGroupId);
    const groupTasks = tasks.filter(t => t.groupId === activeGroupId);

    // Todo: Sorting logic (completed at bottom, etc.)

    const handleAddTask = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newTaskTitle.trim() && activeGroupId) {
            addTask({
                groupId: activeGroupId,
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                reminderEnabled: false,
                isCompleted: false,
                customFieldValues: []
            });
            setNewTaskTitle('');
            setNewTaskDescription('');
            // Keep focus open if they are adding multiple? Maybe no.
        }
    };

    if (!activeGroup) {
        return <div className="p-8 text-center text-muted-foreground">Select a group</div>;
    }

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-6">
            <header className="mb-8 flex items-start justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg">
                            #
                        </span>
                        {activeGroup.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 ml-1">{groupTasks.length} tasks</p>
                </div>

                {activeGroup.id !== 'default' && (
                    <button
                        onClick={() => {
                            const groupToDelete = activeGroup;
                            const tasksToDelete = groupTasks;
                            useTodoStore.getState().deleteGroup(activeGroup.id);
                            toast.success('Group deleted', {
                                description: `${activeGroup.name} and ${tasksToDelete.length} tasks removed`,
                                action: {
                                    label: 'Undo',
                                    onClick: () => useTodoStore.getState().restoreGroup(groupToDelete, tasksToDelete)
                                }
                            });
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        title="Delete Group"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </header>

            <div className="space-y-3 flex-1 overflow-y-auto pb-20">
                {groupTasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onClick={() => useTodoStore.getState().setActiveTask(task.id)}
                    />
                ))}

                {groupTasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                        <p>No tasks yet. Add one below!</p>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div
                    className={cn(
                        "relative group bg-card border border-border rounded-xl shadow-sm transition-all overflow-hidden",
                        isInputFocused ? "ring-2 ring-primary/20 border-primary" : ""
                    )}
                >
                    <div className="absolute left-4 top-4 text-muted-foreground">
                        <Plus className="w-5 h-5" />
                    </div>

                    <input
                        type="text"
                        value={newTaskTitle}
                        onFocus={() => setIsInputFocused(true)}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddTask();
                            }
                        }}
                        placeholder="Add a new task..."
                        className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-0"
                    />

                    {/* Expandable Description Area */}
                    {(isInputFocused || newTaskDescription || newTaskTitle) && (
                        <div className="px-12 pb-3 animate-in fade-in slide-in-from-top-1">
                            <textarea
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.metaKey) {
                                        handleAddTask();
                                    }
                                }}
                                placeholder="Description (optional)"
                                className="w-full bg-transparent border-none p-0 text-sm text-muted-foreground focus:outline-none focus:ring-0 resize-none min-h-[40px]"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/50">
                                <button
                                    onClick={() => {
                                        setIsInputFocused(false);
                                        setNewTaskTitle('');
                                        setNewTaskDescription('');
                                    }}
                                    className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAddTask()}
                                    disabled={!newTaskTitle.trim()}
                                    className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Add Task
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
