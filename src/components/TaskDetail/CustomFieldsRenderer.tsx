import type { CustomField } from '../../types/todo';
import { Check, ChevronDown } from 'lucide-react';

interface CustomFieldsRendererProps {
    fields: CustomField[];
    onFieldUpdate: (fieldId: string, newValue: any) => void;
    onFieldDelete: (fieldId: string) => void; // Optional: ablity to remove fields
}

export function CustomFieldsRenderer({ fields, onFieldUpdate, onFieldDelete }: CustomFieldsRendererProps) {
    if (!fields || fields.length === 0) return null;

    return (
        <div className="space-y-4">
            {fields.map((field) => (
                <div key={field.id} className="space-y-1.5 group">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground uppercase">{field.label}</label>
                        {/* Delete button hidden until hover */}
                        <button onClick={() => onFieldDelete(field.id)} className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity">
                            Remove
                        </button>
                    </div>

                    {/* Render based on Type */}

                    {field.type === 'text' && (
                        <input
                            type="text"
                            value={field.value as string}
                            onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    )}

                    {field.type === 'textarea' && (
                        <textarea
                            value={field.value as string}
                            onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                            className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
                        />
                    )}

                    {field.type === 'checkbox' && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onFieldUpdate(field.id, !field.value)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${field.value ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border'}`}
                            >
                                {field.value && <Check className="w-3 h-3" />}
                            </button>
                            <span className="text-sm">{field.value ? 'Yes' : 'No'}</span>
                        </div>
                    )}

                    {field.type === 'radio' && field.options && (
                        <div className="space-y-1">
                            {field.options.map(opt => (
                                <label key={opt} className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`field-${field.id}`}
                                        checked={field.value === opt}
                                        onChange={() => onFieldUpdate(field.id, opt)}
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {field.type === 'dropdown' && (
                        <div className="relative">
                            <select
                                value={field.value as string}
                                onChange={(e) => onFieldUpdate(field.id, e.target.value)}
                                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                            >
                                <option value="">Select...</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                {field.allowCustomOption && (
                                    <option value="__custom__">+ Add Other...</option>
                                )}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

                            {/* Logic for custom option could be handled by checking if value is not in options, or a prompt.
                      For simplicity, if they pick __custom__, we could prompt or switch to text input. 
                      Let's stick to simple dropdown for now or handle the __custom__ case.
                  */}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
