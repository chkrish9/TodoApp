import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

// Helper to check if device is iOS
const isIOS = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

// Helper to check if running in standalone mode (already installed)
const isStandalone = () => {
    return ('standalone' in window.navigator) && (window.navigator as any).standalone;
};

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOSPromptVisible, setIsIOSPromptVisible] = useState(false);
    const [isAndroidPromptVisible, setIsAndroidPromptVisible] = useState(false);

    useEffect(() => {
        // Android / Desktop Chrome
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsAndroidPromptVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS - Show prompt if not already installed and is iOS
        if (isIOS() && !isStandalone()) {
            // Check if user has dismissed it recently in localStorage if desired
            // For now, simpler: show it. 
            // Better: Delay it slightly so it looks intentional
            setTimeout(() => setIsIOSPromptVisible(true), 1000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setIsAndroidPromptVisible(false);
    };

    if (!isAndroidPromptVisible && !isIOSPromptVisible) return null;

    if (isIOSPromptVisible) {
        return (
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border shadow-lg rounded-xl p-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="flex items-start justify-between gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Download className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-sm">Install App</h3>
                        <p className="text-muted-foreground text-xs mt-1">
                            To install on iOS:
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                            1. Tap the <span className="font-bold">Share</span> button <span className="inline-block border border-border p-0.5 rounded">⎋</span>
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                            2. Select <span className="font-bold">Add to Home Screen</span>
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => setIsIOSPromptVisible(false)}
                                className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsIOSPromptVisible(false)}
                        className="text-muted-foreground hover:text-foreground p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

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
                            onClick={() => setIsAndroidPromptVisible(false)}
                            className="text-muted-foreground hover:bg-muted px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsAndroidPromptVisible(false)}
                    className="text-muted-foreground hover:text-foreground p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
