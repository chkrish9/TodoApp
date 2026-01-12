export type CustomFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'textarea';

export interface CustomField {
    id: string;
    type: CustomFieldType;
    label: string;
    value: any; // string | boolean | string[]
    options?: string[];
    allowCustomOption?: boolean;
}

export interface Task {
    id: string;
    groupId: string;
    title: string;
    description?: string;
    dueDate?: string; // ISO string
    reminderEnabled: boolean;
    isCompleted: boolean;
    customFieldValues: CustomField[]; // Changed from customFieldValues: CustomFieldValue[] to CustomField[] for ad-hoc simplicity
    createdAt: number;
}

export interface Group {
    id: string;
    name: string;
    icon?: string;
    color?: string;
}

// Deprecated interfaces but kept for compatibility if needed (cleaned up in future)
export interface CustomFieldDefinition {
    id: string;
    type: CustomFieldType;
    label: string;
    options?: string[];
    allowCustomOption?: boolean;
}
export interface CustomFieldValue {
    id: string;
    type: CustomFieldType;
    label: string;
    value: any;
    options?: string[];
    allowCustomOption?: boolean;
}
