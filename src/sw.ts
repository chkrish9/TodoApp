/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('push', (event: PushEvent) => {
    const data = event?.data?.json() ?? { title: 'Todo App', body: 'New notification', url: '/' };

    event?.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            data: { url: data.url }
        })
    );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event?.notification.close();

    event?.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (const client of windowClients) {
                if ('url' in client && client.url === event?.notification.data.url && 'focus' in client) {
                    return (client as WindowClient).focus();
                }
            }
            // If not, open a new window/tab with the target URL
            if (self.clients.openWindow) {
                return self.clients.openWindow(event?.notification.data.url);
            }
        })
    );
});
