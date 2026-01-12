
import React, { useState } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { cn } from '../../lib/utils';
import {
    List,
    Plus,
    Trash2,
    LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Moon, Sun } from 'lucide-react';

function ThemeToggle() {
    const { theme, setTheme } = useThemeStore();

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
        >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
    );
}



interface SidebarProps {
    onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
    const { groups, activeGroupId, setActiveGroup, addGroup, deleteGroup } = useTodoStore();
    const { user, logout } = useAuthStore();
    const [isAddingString, setIsAddingString] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGroupName.trim()) {
            addGroup({
                name: newGroupName,
                icon: 'List',
                color: 'blue' // Default color
            });
            setNewGroupName('');
            setIsAddingString(false);
        }
    };

    return (
        <div className="w-64 bg-card h-screen border-r border-border flex flex-col p-4 shadow-xl md:shadow-none">
            <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <List className="text-primary-foreground w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Todo</h1>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
                <button
                    onClick={() => {
                        setActiveGroup('today');
                        onItemClick?.();
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-4",
                        activeGroupId === 'today'
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span className="w-4 h-4 flex items-center justify-center">📅</span>
                        <span>Today</span>
                    </div>
                </button>

                <h2 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
                    Collections
                </h2>

                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => {
                            setActiveGroup(group.id);
                            onItemClick?.();
                        }}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                            activeGroupId === group.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <List className="w-4 h-4" />
                            <span>{group.name}</span>
                        </div>

                        {group.id !== 'default' && (
                            <div
                                role="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const groupToDelete = group;
                                    // Capture tasks before they are deleted from store (since deleteGroup cascades)
                                    // Wait, useTodoStore.getState().tasks will still have them until next render?
                                    // No, we need to grab them first.
                                    const tasksToDelete = useTodoStore.getState().tasks.filter(t => t.groupId === group.id);

                                    deleteGroup(group.id);
                                    toast.success('Group deleted', {
                                        description: `${group.name} and ${tasksToDelete.length} tasks removed`,
                                        action: {
                                            label: 'Undo',
                                            onClick: () => useTodoStore.getState().restoreGroup(groupToDelete, tasksToDelete)
                                        }
                                    });
                                }}
                                className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </div>
                        )}
                    </button>
                ))}

                {isAddingString ? (
                    <form onSubmit={handleAddGroup} className="mt-2 px-2">
                        <input
                            autoFocus
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Group name..."
                            className="w-full bg-background border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onBlur={() => !newGroupName && setIsAddingString(false)}
                        />
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAddingString(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Group</span>
                    </button>
                )}
            </div>

            <div className="mt-auto px-2 py-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                        {user?.username}
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <button
                            onClick={logout}
                            className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    v1.0.0
                </div>
            </div>
        </div>
    );
}
