import React, { useState, useMemo } from 'react';
import { Plus, Type, CheckSquare, Disc, List as ListIcon } from 'lucide-react';
import { useTodoStore } from '../../stores/todoStore';
import type { CustomFieldType, CustomField, Task } from '../../types/todo';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../../lib/utils';

// Helper to get icon for type
const getTypeIcon = (type: CustomFieldType) => {
    switch (type) {
        case 'text': return Type;
        case 'checkbox': return CheckSquare;
        case 'radio': return Disc;
        case 'dropdown': return ListIcon;
        case 'textarea': return Type;
        default: return Type;
    }
};

interface CustomFieldManagerProps {
    task: Task;
    onUpdate: (fields: CustomField[]) => void;
}

export function CustomFieldManager({ task, onUpdate }: CustomFieldManagerProps) {
    const { tasks } = useTodoStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState<CustomFieldType>('text');

    const [newOptions, setNewOptions] = useState<string[]>([]);
    const [newOptionInput, setNewOptionInput] = useState('');

    // Suggest existing field definitions
    const suggestedFields = useMemo(() => {
        // Collect unique fields by label from all tasks
        const map = new Map<string, CustomField>();
        tasks.forEach(t => {
            if (!t.customFieldValues) return;
            t.customFieldValues.forEach((f: CustomField) => {
                if (!map.has(f.label)) {
                    map.set(f.label, f);
                }
            });
        });
        return Array.from(map.values());
    }, [tasks]);

    const handleCreateField = (fieldTemplate?: CustomField) => {
        const field: CustomField = {
            id: uuidv4(),
            type: fieldTemplate ? fieldTemplate.type : newType,
            label: fieldTemplate ? fieldTemplate.label : newLabel,
            value: fieldTemplate
                ? (fieldTemplate.type === 'checkbox' ? false : '') // Reset value when importing
                : (newType === 'checkbox' ? false : ''),
            options: fieldTemplate ? fieldTemplate.options : newOptions,
            allowCustomOption: fieldTemplate ? fieldTemplate.allowCustomOption : true
        };

        onUpdate([...(task.customFieldValues || []), field]);
        setIsAdding(false);
        setNewLabel('');
        setNewOptions([]);
        setNewType('text');
    };

    return (
        <div className="space-y-4 pt-4 border-t border-dashed border-border">
            {isAdding ? (
                <div className="bg-muted/30 p-3 rounded-md border border-border animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                        {/* Suggestions */}
                        {suggestedFields.length > 0 && !newLabel && (
                            <div className="mb-2">
                                <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Suggestions from other tasks:</p>
                                <div className="flex flex-wrap gap-1">
                                    {suggestedFields.map((f: CustomField) => (
                                        <button
                                            key={f.id}
                                            onClick={() => handleCreateField(f)}
                                            className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
                                        >
                                            {React.createElement(getTypeIcon(f.type), { className: "w-3 h-3" })}
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input
                            autoFocus
                            type="text"
                            placeholder="Field Name (e.g. Priority, Client)"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                        />

                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {(['text', 'checkbox', 'dropdown', 'radio'] as CustomFieldType[]).map(type => {
                                const Icon = getTypeIcon(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setNewType(type)}
                                        className={cn(
                                            "flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors whitespace-nowrap",
                                            newType === type
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="w-3 h-3" />
                                        <span className="capitalize">{type}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {(newType === 'dropdown' || newType === 'radio') && (
                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground">Options</label>
                                <div className="flex gap-2">
                                    <input
                                        value={newOptionInput}
                                        onChange={(e) => setNewOptionInput(e.target.value)}
                                        placeholder="Add option..."
                                        className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newOptionInput.trim()) {
                                                    setNewOptions([...newOptions, newOptionInput.trim()]);
                                                    setNewOptionInput('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newOptionInput.trim()) {
                                                setNewOptions([...newOptions, newOptionInput.trim()]);
                                                setNewOptionInput('');
                                            }
                                        }}
                                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {newOptions.map((opt, i) => (
                                        <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                                            {opt}
                                            <button onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}>&times;</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCreateField()}
                                disabled={!newLabel}
                                className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs disabled:opacity-50"
                            >
                                Create Field
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    <Plus className="w-4 h-4" />
                    Add Custom Field
                </button>
            )}
        </div>
    );
}
