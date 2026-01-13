import React, { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../../api/client';
import { Lock, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-foreground">
                        <Lock className="w-5 h-5" />
                        <h2 className="text-xl font-semibold">Security</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Updating...' : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
