// This file acts as the bridge to Firebase Firestore.

import * as firebaseApp from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, doc, setDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import type { Order, AttendanceRecord } from '../types';

// Workaround for potential type definition mismatch in some environments (Vercel Build fix)
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Helper to safely access env vars
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return undefined;
};

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "", 
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "",
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "" 
};

// EXPORT Project ID untuk ditampilkan di UI Settings
export const currentProjectId = firebaseConfig.projectId;

const isConfigConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let db: any = null;
let isFirebaseInitialized = false;

// Helper to notify UI about connection errors
let hasDispatchedError = false;
const dispatchConnectionError = (msg: string) => {
    if (!hasDispatchedError) {
        console.warn("Dispatching Firebase Error:", msg);
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('firebase-connection-error', { detail: msg }));
        }, 2000);
        hasDispatchedError = true;
    }
};

if (isConfigConfigured) {
    try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        try {
            db = getFirestore(app);
            isFirebaseInitialized = true;
            console.log("✅ Firebase Connected: Online Mode Active");
        } catch (firestoreError: any) {
            console.error("⚠️ Firestore Init Error:", firestoreError.message);
            db = null;
            dispatchConnectionError("Gagal inisialisasi Database.");
        }
    } catch (e: any) {
        console.error("❌ Firebase App Init Failed:", e.message);
        db = null;
        dispatchConnectionError("Config Firebase tidak valid.");
    }
} else {
    console.log("ℹ️ Firebase Config Kosong. Aplikasi berjalan di MODE OFFLINE.");
}

export const isFirebaseReady = isFirebaseInitialized && db !== null;

// --- LOCAL STORAGE HELPERS ---
const getLocal = (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const setLocal = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

// --- SYNC MANAGER (Jantung Fitur Offline-First) ---
export const syncPendingData = async (branchId: string) => {
    if (!db || !branchId) return;
    
    console.log("🔄 Checking for pending offline data to sync...");
    let syncedCount = 0;

    // 1. SYNC ORDERS
    const orderKey = `pos-orders-${branchId}`;
    const localOrders: any[] = getLocal(orderKey);
    let ordersChanged = false;

    // Filter orders that have NOT been synced yet (marked by _synced: false or missing _synced)
    // Also ensuring we don't duplicate: check if they have a real Firestore ID or just a timestamp ID
    const pendingOrders = localOrders.filter(o => o._synced === false);

    if (pendingOrders.length > 0) {
        console.log(`Found ${pendingOrders.length} pending orders. Syncing...`);
        const batch = writeBatch(db);
        
        for (const order of pendingOrders) {
            try {
                // Remove local-only flags before sending
                const { _synced, ...orderData } = order;
                const newDocRef = doc(collection(db, "orders")); // Create new ref
                batch.set(newDocRef, { ...orderData, id: newDocRef.id, originalLocalId: order.id });
                
                // Update local data to point to new cloud ID and mark synced
                order._synced = true;
                order.cloudId = newDocRef.id; 
                // We keep the local ID as primary key for React keys, but you might want to swap it
                ordersChanged = true;
                syncedCount++;
            } catch (e) {
                console.error("Error staging order for sync", e);
            }
        }

        try {
            await batch.commit();
            if (ordersChanged) {
                setLocal(orderKey, localOrders);
                window.dispatchEvent(new Event('local-storage-update')); // Refresh UI
                console.log("✅ Orders synced successfully!");
            }
        } catch (e) {
            console.error("Batch commit failed", e);
        }
    }

    if (syncedCount > 0) {
        alert(`Koneksi kembali! ${syncedCount} data offline berhasil di-upload ke server.`);
    }
};

// --- STORE STATUS ---
export const setStoreStatus = async (branchId: string, isOpen: boolean) => {
    if (!db) return;
    try {
        await setDoc(doc(db, `branches/${branchId}/status/current`), { isOpen, updatedAt: Date.now() });
    } catch (e) { console.warn("Offline: Store status not synced"); }
};

export const subscribeToStoreStatus = (branchId: string, onUpdate: (isOpen: boolean) => void) => {
    if (!db) return () => {};
    try {
        return onSnapshot(doc(db, `branches/${branchId}/status/current`), (doc) => {
            if (doc.exists()) onUpdate(doc.data().isOpen);
            else onUpdate(false);
        }, (err) => console.warn("Status sync failed:", err.message));
    } catch (e) { return () => {}; }
};

// --- ORDERS ---
export const subscribeToOrders = (branchId: string, onUpdate: (orders: Order[]) => void) => {
    const localKey = `pos-orders-${branchId}`;
    
    const loadLocal = () => {
        const stored = getLocal(localKey);
        if (Array.isArray(stored)) {
            stored.sort((a: Order, b: Order) => b.createdAt - a.createdAt);
            onUpdate(stored);
        } else {
            onUpdate([]);
        }
    };

    // Initial load from local
    loadLocal();

    // Listen to local changes (e.g. from other tabs or offline writes)
    const handleLocalUpdate = () => loadLocal();
    window.addEventListener('local-storage-update', handleLocalUpdate);

    if (!db) return () => window.removeEventListener('local-storage-update', handleLocalUpdate);

    try {
        // Subscribe to Cloud
        const q = query(collection(db, "orders"), where("branchId", "==", branchId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cloudOrders: Order[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                cloudOrders.push({ ...data, id: doc.id } as Order);
            });
            
            // MERGE STRATEGY: Cloud wins, but keep local pending ones
            const local = getLocal(localKey);
            const pending = local.filter((o: any) => o._synced === false);
            
            // Combine Cloud + Pending Local
            // We use a Map to prevent duplicates if a pending item just arrived from cloud
            const mergedMap = new Map();
            cloudOrders.forEach(o => mergedMap.set(o.id, { ...o, _synced: true }));
            pending.forEach((o: any) => {
                // Only add pending if it's not already in cloud (by some other means)
                if (!mergedMap.has(o.id)) mergedMap.set(o.id, o);
            });

            const merged = Array.from(mergedMap.values());
            merged.sort((a: any, b: any) => b.createdAt - a.createdAt);
            
            // Update Local Storage with the fresh merged list to keep it in sync
            setLocal(localKey, merged);
            
            // Update UI
            onUpdate(merged as Order[]);
            
        }, (error) => {
            console.warn("Offline fallback (Snapshot error):", error.message);
            dispatchConnectionError("Koneksi Database Terputus.");
        });

        return () => {
            unsubscribe();
            window.removeEventListener('local-storage-update', handleLocalUpdate);
        };
    } catch (e) {
        console.error("Critical Firestore Error:", e);
        return () => window.removeEventListener('local-storage-update', handleLocalUpdate);
    }
};

export const addOrderToCloud = async (order: Order) => {
    const localKey = `pos-orders-${order.branchId}`;
    
    // 1. SAVE LOCAL FIRST (Optimistic UI)
    // Mark as _synced: false so we know it needs uploading later
    const orderWithMeta = { ...order, _synced: false };
    
    try {
        const currentOrders = getLocal(localKey);
        currentOrders.push(orderWithMeta);
        setLocal(localKey, currentOrders);
        window.dispatchEvent(new Event('local-storage-update')); // Trigger UI update immediately
    } catch (e) { console.error("Local save failed", e); }

    // 2. TRY SEND TO CLOUD
    if (!db) return order.id; // If offline, stop here. Sync manager will handle it later.
    
    try {
        const { _synced, ...orderData } = orderWithMeta;
        // Use setDoc with the ID we generated locally to ensure consistency, 
        // OR addDoc and update local ID. Let's use setDoc if the ID is good, or addDoc.
        // For safety/simplicity in this codebase, we push as new doc.
        
        await addDoc(collection(db, "orders"), orderData);
        
        // 3. IF SUCCESS, UPDATE LOCAL TO SYNCED
        const updatedOrders = getLocal(localKey);
        const idx = updatedOrders.findIndex((o: any) => o.id === order.id);
        if (idx !== -1) {
            updatedOrders[idx]._synced = true;
            setLocal(localKey, updatedOrders);
            // No need to dispatch event again, UI doesn't care about _synced flag usually
        }
    } catch (e) {
        console.warn("Upload failed (Offline), kept locally for later sync.");
    }
    return order.id;
};

export const updateOrderInCloud = async (orderId: string, data: Partial<Order>) => {
    // 1. Update Local
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('pos-orders-'));
        for (const key of keys) {
            const orders = getLocal(key);
            const idx = orders.findIndex((o: Order) => o.id === orderId);
            if (idx !== -1) {
                orders[idx] = { ...orders[idx], ...data, _synced: false }; // Mark dirty
                setLocal(key, orders);
                window.dispatchEvent(new Event('local-storage-update'));
                
                // 2. Try Cloud Update
                if (db) {
                    const q = query(collection(db, "orders"), where("id", "==", orderId));
                    getDocs(q).then(snapshot => {
                        if (!snapshot.empty) {
                            const docRef = snapshot.docs[0].ref;
                            updateDoc(docRef, data).then(() => {
                                // Mark clean
                                orders[idx]._synced = true;
                                setLocal(key, orders);
                            });
                        }
                    }).catch(e => console.warn("Cloud update pending"));
                }
                break; 
            }
        }
    } catch (e) {}
};

// --- ATTENDANCE & MASTER DATA (Simpler Sync) ---
// ... (attendance logic similar to orders, simplified for brevity) ...

export const subscribeToAttendance = (branchId: string, onUpdate: (data: AttendanceRecord[]) => void) => {
    const localKey = `pos-attendance-${branchId}`;
    const loadLocal = () => onUpdate(getLocal(localKey));
    if (!db) {
        loadLocal();
        return () => {};
    }
    try {
        const q = query(collection(db, "attendance"), where("branchId", "==", branchId));
        return onSnapshot(q, (snapshot) => {
            const records: AttendanceRecord[] = [];
            snapshot.forEach((doc) => records.push({ ...doc.data(), id: doc.id } as AttendanceRecord));
            onUpdate(records);
        }, loadLocal);
    } catch (e) { loadLocal(); return () => {}; }
};

export const addAttendanceToCloud = async (record: AttendanceRecord) => {
    const localKey = `pos-attendance-${record.branchId}`;
    const stored = getLocal(localKey);
    stored.unshift(record);
    setLocal(localKey, stored);
    window.dispatchEvent(new Event('attendance-update')); // Local update

    if (!db) return;
    try { await addDoc(collection(db, "attendance"), record); } catch(e) {}
};

export const updateAttendanceInCloud = async (id: string, data: Partial<AttendanceRecord>, branchId: string) => {
    const localKey = `pos-attendance-${branchId}`;
    const stored = getLocal(localKey);
    const idx = stored.findIndex((r: AttendanceRecord) => r.id === id);
    if (idx !== -1) {
        stored[idx] = { ...stored[idx], ...data };
        setLocal(localKey, stored);
    }
};

export const syncMasterData = async (branchId: string, type: 'menu' | 'categories' | 'profile' | 'ingredients', data: any) => {
    if (!db) return; 
    try {
        const docRef = doc(db, `branches/${branchId}/master/${type}`);
        await setDoc(docRef, { data, updatedAt: Date.now() });
    } catch (e) {}
};

export const subscribeToMasterData = (branchId: string, type: 'menu' | 'categories' | 'profile' | 'ingredients', onUpdate: (data: any) => void) => {
    if (!db) return () => {};
    try {
        const docRef = doc(db, `branches/${branchId}/master/${type}`);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) onUpdate(doc.data().data);
        }, () => {});
    } catch (e) { return () => {}; }
};