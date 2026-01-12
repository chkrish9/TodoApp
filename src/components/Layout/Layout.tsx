import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TaskDetail } from '../TaskDetail/TaskDetail';
import { Menu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTodoStore } from '../../stores/todoStore';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const fetchData = useTodoStore(state => state.fetchData);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 h-full md:relative md:block transition-transform duration-200 ease-in-out transform shadow-xl md:shadow-none",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
            </div>

            <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
                {/* Mobile Header */}
                <div className="md:hidden p-4 flex items-center border-b border-border bg-card">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 hover:bg-muted rounded-md">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-3 font-semibold">Todo</span>
                </div>

                {children}
                <TaskDetail />
            </main>
        </div>
    );
}
