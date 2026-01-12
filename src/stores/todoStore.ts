import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { Task, Group, CustomFieldDefinition } from '../types/todo';

interface TodoState {
    tasks: Task[];
    groups: Group[];
    customFieldDefinitions: CustomFieldDefinition[];
    activeGroupId: string | null;
    activeTaskId: string | null;

    // Actions
    fetchData: () => Promise<void>;

    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTaskCompletion: (id: string) => Promise<void>;

    addGroup: (group: Omit<Group, 'id'>) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;
    setActiveGroup: (id: string | null) => void;
    setActiveTask: (id: string | null) => void;

    restoreTask: (task: Task) => Promise<void>;
    restoreGroup: (group: Group, tasks: Task[]) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
    tasks: [],
    groups: [],
    customFieldDefinitions: [],
    activeGroupId: null, // Will be set after fetch
    activeTaskId: null,

    fetchData: async () => {
        try {
            const [groups, tasks] = await Promise.all([
                apiClient.get('/groups'),
                apiClient.get('/tasks')
            ]);

            set({
                groups,
                tasks,
                // Set default group to 'today'
                activeGroupId: get().activeGroupId || 'today'
            });
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    },

    addTask: async (task) => {
        console.log('[Store] Adding task:', task);
        try {
            const newTask = await apiClient.post('/tasks', task);
            set((state) => ({
                tasks: [...state.tasks, newTask]
            }));
        } catch (error) {
            console.error('Failed to add task:', error);
        }
    },

    updateTask: async (id, updates) => {
        console.log('[Store] Updating task:', id, updates);
        try {
            const updatedTask = await apiClient.patch(`/tasks/${id}`, updates);
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t))
            }));
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    },

    deleteTask: async (id) => {
        console.log('[Store] Deleting task:', id);
        try {
            await apiClient.delete(`/tasks/${id}`);
            set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== id),
                activeTaskId: state.activeTaskId === id ? null : state.activeTaskId
            }));
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    },

    toggleTaskCompletion: async (id) => {
        console.log('[Store] Toggling task completion:', id);
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;

        try {
            const updatedTask = await apiClient.patch(`/tasks/${id}`, {
                is_completed: !task.isCompleted
            });
            // Backend returns camelCase keys now
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? { ...t, isCompleted: updatedTask.isCompleted } : t))
            }));
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    },

    addGroup: async (group) => {
        console.log('[Store] Adding group:', group);
        try {
            const newGroup = await apiClient.post('/groups', group);
            set((state) => ({
                groups: [...state.groups, newGroup]
            }));
        } catch (error) {
            console.error('Failed to add group:', error);
        }
    },

    deleteGroup: async (id) => {
        console.log('[Store] Deleting group:', id);
        try {
            await apiClient.delete(`/groups/${id}`);
            set((state) => ({
                groups: state.groups.filter((g) => g.id !== id),
                tasks: state.tasks.filter((t) => t.groupId !== id),
                activeGroupId: state.activeGroupId === id ? (state.groups[0]?.id || null) : state.activeGroupId
            }));
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    },

    setActiveGroup: (id) => set({ activeGroupId: id }),
    setActiveTask: (id) => set({ activeTaskId: id }),

    restoreTask: async (task) => {
        try {
            // For restore, we essentially re-create it. 
            // Issues: ID preservation. Postgres usually generates IDs.
            // We'll create a new task with the same details.
            await get().addTask({
                groupId: task.groupId,
                title: task.title,
                description: task.description,
                reminderEnabled: task.reminderEnabled,
                isCompleted: task.isCompleted,
                customFieldValues: task.customFieldValues
            } as any);
        } catch (error) {
            console.error('Restore failed', error);
        }
    },

    restoreGroup: async (group, tasks) => {
        try {
            const newGroupVal = await apiClient.post('/groups', {
                name: group.name,
                icon: group.icon,
                color: group.color
            });

            // Restore tasks for this group
            await Promise.all(tasks.map(t => apiClient.post('/tasks', {
                group_id: newGroupVal.id,
                title: t.title,
                description: t.description,
                is_completed: t.isCompleted,
                reminder_enabled: t.reminderEnabled,
                due_date: t.dueDate,
                custom_field_values: t.customFieldValues
            })));

            // Refresh data
            get().fetchData();
        } catch (error) {
            console.error('Restore group failed', error);
        }
    }
}));
