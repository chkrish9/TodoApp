import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { config } from '../../config';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '../../lib/utils';

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Zod Validation
        const result = loginSchema.safeParse({ username, password });
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

        try {
            const success = await login(username, password);
            if (success) {
                toast.success('Welcome back!');
                navigate('/');
            } else {
                // The store/client logs the error, but we show a generic one here if logic false
                // ideally `login` should throw or return the error message
                toast.error('Invalid username or password');
            }
        } catch (error: any) {
            toast.error(error.message || 'Login failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl shadow-lg border border-border">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
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
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors"
                    >
                        Sign in
                    </button>
                </form>

                {config.ENABLE_REGISTRATION && (
                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
