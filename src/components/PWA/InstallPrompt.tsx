import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border shadow-lg rounded-xl p-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-start justify-between gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Download className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm">Install App</h3>
                    <p className="text-muted-foreground text-xs mt-1">
                        Install Todo for a better experience with offline access and standalone mode.
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleInstallClick}
                            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                            Install Now
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-muted-foreground hover:bg-muted px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-muted-foreground hover:text-foreground p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
