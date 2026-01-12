import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { config } from '../../config';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../../lib/utils';
import { registerSchema } from '../../schemas/validation';

export function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const register = useAuthStore(state => state.register);
    const navigate = useNavigate();

    useEffect(() => {
        if (!config.ENABLE_REGISTRATION) {
            toast.error('Registration is currently disabled');
            navigate('/login');
        }
    }, [navigate]);

    if (!config.ENABLE_REGISTRATION) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Zod Validation
        const result = registerSchema.safeParse({ username, password, confirmPassword });
        if (!result.success) {
            const formattedErrors: { [key: string]: string } = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    formattedErrors[issue.path[0] as string] = issue.message;
                }
            });
            setErrors(formattedErrors);
            return;
        }

        const success = await register(username, password);
        if (success) {
            toast.success('Account created!');
            navigate('/');
        } else {
            toast.error('Registration failed. Username might be taken.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border relative">
                <Link to="/login" className="absolute left-8 top-8 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                </Link>

                <div className="text-center mt-4">
                    <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Get started with your tasks</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                required
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={cn(
                                    "w-full rounded-md border bg-transparent px-10 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                                    errors.username ? "border-red-500 focus:ring-red-500" : "border-input"
                                )}
                            />
                            {errors.username && <p className="text-xs text-red-500 mt-1 ml-1">{errors.username}</p>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    "w-full rounded-md border bg-transparent px-10 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                                    errors.password ? "border-red-500 focus:ring-red-500" : "border-input"
                                )}
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                required
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={cn(
                                    "w-full rounded-md border bg-transparent px-10 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                                    errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-input"
                                )}
                            />
                            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                    >
                        Sign up
                    </button>
                </form>
            </div>
        </div>
    );
}
