import { Check, Calendar, Trash2 } from 'lucide-react';
import type { Task } from '../../types/todo';
import { cn } from '../../lib/utils';
import { useTodoStore } from '../../stores/todoStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskItemProps {
    task: Task;
    onClick: () => void;
}

export function TaskItem({ task, onClick }: TaskItemProps) {
    const { toggleTaskCompletion } = useTodoStore();

    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex items-center gap-3 p-3 bg-card hover:bg-accent/50 border border-border rounded-lg shadow-sm transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-200",
                task.isCompleted && "opacity-60 bg-muted/50"
            )}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                }}
                className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    task.isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground hover:border-primary"
                )}
            >
                {task.isCompleted && <Check className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
                <span className={cn(
                    "block truncate font-medium",
                    task.isCompleted && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </span>

                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs mt-1",
                        task.isCompleted ? "text-muted-foreground" : "text-primary"
                    )}>
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(task.dueDate.includes('T') ? task.dueDate : `${task.dueDate}T12:00:00`), 'MMM d')}</span>
                    </div>
                )}

                {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                    </p>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    const taskToDelete = task;
                    useTodoStore.getState().deleteTask(task.id);
                    toast.success('Task deleted', {
                        description: task.title,
                        action: {
                            label: 'Undo',
                            onClick: () => useTodoStore.getState().restoreTask(taskToDelete)
                        }
                    });
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all sm:ml-2"
                title="Delete Task"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
