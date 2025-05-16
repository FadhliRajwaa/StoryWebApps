// src/utils/notifications.js
import axios from 'axios';
import { Auth } from './auth.js';
import { showToast } from './toast.js';

const API_BASE_URL = 'https://story-api.dicoding.dev/v1';
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

export async function subscribeToNotifications(title, options) {
  console.log('Notifications: subscribeToNotifications called with title:', title);

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported in this browser');
    showToast({ message: title, type: 'success' });
    return;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      showToast({ message: title, type: 'success' });
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('Notifications: No existing subscription, creating new one');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    } else {
      console.log('Notifications: Existing subscription found, reusing it');
    }

    const token = Auth.getToken();
    if (!token) {
      console.warn('No token found, cannot subscribe to notifications');
      showToast({ message: title, type: 'success' });
      return;
    }

    // Send subscription to server (only if not already subscribed)
    const subscriptionKey = arrayBufferToBase64(subscription.getKey('auth'));
    if (!localStorage.getItem(`subscription:${subscriptionKey}`)) {
      console.log('Notifications: Sending subscription to server');
      await axios.post(
        `${API_BASE_URL}/notifications/subscribe`,
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: subscriptionKey,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      localStorage.setItem(`subscription:${subscriptionKey}`, 'true');
    } else {
      console.log('Notifications: Subscription already sent to server');
    }

    // Gunakan tag unik berdasarkan timestamp untuk mencegah duplikat
    const notificationTag = options.tag || `story-added-${Date.now()}`;
    const dismissedKey = `notification:dismissed:${notificationTag}`;

    // Cek apakah notifikasi dengan tag ini sudah dismissed
    if (localStorage.getItem(dismissedKey)) {
      console.log(`Notifications: Notification with tag ${notificationTag} was previously dismissed, skipping.`);
      return;
    }

    const enhancedOptions = {
      ...options,
      icon: '/Logo.png',
      badge: '/Logo.png',
      image: '/Logo.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view-story', title: 'Lihat Cerita', icon: '/Logo.png' },
        { action: 'dismiss', title: 'Tutup', icon: '/Logo.png' },
      ],
      data: {
        url: window.location.origin + '#/home',
      },
      tag: notificationTag, // Gunakan tag unik
      renotify: true, // Izinkan renotify untuk tag yang sama (opsional)
    };

    console.log('Notifications: Showing notification with options:', enhancedOptions);
    await registration.showNotification(title, enhancedOptions);

    // Bersihkan entri dismissed lama
    cleanOldDismissedNotifications(50);

    // Listen for messages from the service worker about notification dismissal
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notificationclosed' && event.data.tag === notificationTag) {
        console.log(`Notifications: Notification with tag ${notificationTag} was closed.`);
        localStorage.setItem(dismissedKey, 'true'); // Mark as dismissed
      }
    });
  } catch (error) {
    console.error('Notifications: Error subscribing to notifications:', error);
    showToast({ message: title, type: 'success' });
  }
}

// Fungsi untuk membersihkan entri dismissed lama di localStorage
export function cleanOldDismissedNotifications(maxEntries = 50) {
  const prefix = 'notification:dismissed:';
  const keys = Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .sort(); // Urutkan berdasarkan nama (yang mengandung timestamp)

  if (keys.length > maxEntries) {
    const keysToRemove = keys.slice(0, keys.length - maxEntries);
    keysToRemove.forEach(key => {
      console.log(`Notifications: Removing old dismissed entry: ${key}`);
      localStorage.removeItem(key);
    });
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer) {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
}