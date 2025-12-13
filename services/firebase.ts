
import { supabase } from './supabaseClient';
import type { Order, AttendanceRecord, MenuItem, Category, StoreProfile, Ingredient } from '../types';

// --- HELPER: MAPPING DATA (APP <-> DB) ---
// Aplikasi menggunakan camelCase (createdAt), Database SQL menggunakan snake_case (created_at).
// Kita perlu mengubahnya agar cocok.

const mapToAppOrder = (dbOrder: any): Order => {
    return {
        id: dbOrder.id,
        sequentialId: dbOrder.sequential_id,
        customerName: dbOrder.customer_name,
        // Supabase join returns order_items array, map it back to CartItem format
        items: dbOrder.order_items ? dbOrder.order_items.map((i: any) => ({
            id: i.product_id,
            name: i.product_name,
            price: i.price,
            quantity: i.quantity,
            note: i.note,
            // Fallback defaults for CartItem requirements
            category: 'Uncategorized', 
        })) : [],
        total: dbOrder.total,
        subtotal: dbOrder.subtotal,
        discount: dbOrder.discount || 0,
        discountType: 'percent', // Default logic as DB simplifies this
        discountValue: 0,
        taxAmount: dbOrder.tax || 0,
        serviceChargeAmount: dbOrder.service || 0,
        status: dbOrder.status,
        createdAt: new Date(dbOrder.created_at).getTime(), // Convert ISO string back to Timestamp
        completedAt: dbOrder.completed_at ? new Date(dbOrder.completed_at).getTime() : undefined,
        readyAt: undefined, // SQL schema didn't have ready_at, optional logic
        paidAt: dbOrder.payment_status === 'paid' ? new Date(dbOrder.updated_at).getTime() : undefined,
        isPaid: dbOrder.payment_status === 'paid',
        paymentMethod: dbOrder.payment_method,
        shiftId: dbOrder.shift_id,
        orderType: dbOrder.type,
        branchId: dbOrder.branch_id
    };
};

// --- STATUS KONEKSI ---
// Kita anggap "Ready" jika URL Supabase ada.
export const isFirebaseReady = !!import.meta.env.VITE_SUPABASE_URL; 
export const currentProjectId = "Supabase Project";

// --- SYNC PENDING DATA ---
// Supabase menangani offline sync via library-nya sendiri jika dikonfigurasi,
// tapi untuk versi simpel ini kita anggap selalu online.
export const syncPendingData = async (branchId: string) => {
    console.log("Supabase Sync Check for branch:", branchId);
};

// --- STORE STATUS ---
export const setStoreStatus = async (branchId: string, isOpen: boolean) => {
    // Implementasi opsional: Simpan status buka/tutup di tabel branches jika kolom ada
    // Saat ini kita skip atau log saja
    console.log("Set Store Status:", isOpen);
};

export const subscribeToStoreStatus = (branchId: string, onUpdate: (isOpen: boolean) => void) => {
    // Default open for now
    onUpdate(true);
    return () => {};
};

// --- ORDERS (CRUD) ---

export const subscribeToOrders = (branchId: string, onUpdate: (orders: Order[]) => void) => {
    if (!branchId) return () => {};

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })
            .limit(100); // Batasi 100 order terakhir agar ringan

        if (error) {
            console.error("Error fetching orders:", error);
            return;
        }

        if (data) {
            const appOrders = data.map(mapToAppOrder);
            onUpdate(appOrders);
        }
    };

    // 1. Initial Fetch
    fetchOrders();

    // 2. Realtime Subscription
    const channel = supabase
        .channel(`realtime-orders-${branchId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` },
            (payload) => {
                console.log('Realtime Change detected:', payload);
                // Cara paling aman untuk konsistensi data relasional (order + items) 
                // adalah refetch ulang saat ada perubahan pada tabel orders.
                fetchOrders(); 
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const addOrderToCloud = async (order: Order) => {
    const dbOrderPayload = {
        id: order.id, // Gunakan ID dari frontend
        branch_id: order.branchId,
        shift_id: order.shiftId,
        customer_name: order.customerName,
        type: order.orderType,
        status: order.status,
        payment_method: order.paymentMethod,
        payment_status: order.isPaid ? 'paid' : 'unpaid',
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.taxAmount,
        service: order.serviceChargeAmount,
        total: order.total,
        created_at: new Date(order.createdAt).toISOString()
    };

    // 1. Insert Order Header
    const { error: orderError } = await supabase
        .from('orders')
        .insert(dbOrderPayload);

    if (orderError) {
        console.error("Error inserting order:", orderError);
        return null;
    }

    // 2. Insert Order Items
    const itemsPayload = order.items.map(item => ({
        order_id: order.id,
        product_id: item.id, // Pastikan ID product integer jika skema integer
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsPayload);

    if (itemsError) {
        console.error("Error inserting items:", itemsError);
    }

    return order.id;
};

export const updateOrderInCloud = async (orderId: string, data: Partial<Order>) => {
    // Mapping partial updates
    const updates: any = {};
    if (data.status) updates.status = data.status;
    if (data.isPaid !== undefined) updates.payment_status = data.isPaid ? 'paid' : 'unpaid';
    if (data.paymentMethod) updates.payment_method = data.paymentMethod;
    if (data.completedAt) updates.completed_at = new Date(data.completedAt).toISOString();
    
    // Jika ada update items (misal split bill), logic-nya lebih kompleks (delete all items -> re-insert),
    // Untuk simplifikasi di sini kita hanya update status/payment header.
    
    if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase.from('orders').update(updates).eq('id', orderId);
    }
};

// --- ATTENDANCE ---

export const subscribeToAttendance = (branchId: string, onUpdate: (data: AttendanceRecord[]) => void) => {
    const fetchAttendance = async () => {
        const { data } = await supabase
            .from('attendance')
            .select('*')
            .eq('branch_id', branchId)
            .order('clock_in', { ascending: false })
            .limit(50);
            
        if (data) {
            const mapped = data.map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                branchId: r.branch_id,
                date: r.date,
                clockInTime: r.clock_in, // BigInt/Number di DB Supabase
                clockOutTime: r.clock_out,
                status: r.status,
                photoUrl: r.photo_url,
                location: r.lat ? { lat: r.lat, lng: r.lng } : undefined
            }));
            onUpdate(mapped);
        }
    };

    fetchAttendance();
    // Bisa tambahkan realtime subscription juga jika perlu
    return () => {};
};

export const addAttendanceToCloud = async (record: AttendanceRecord) => {
    const payload = {
        id: record.id,
        user_id: record.userId,
        user_name: record.userName,
        branch_id: record.branchId,
        date: record.date,
        clock_in: record.clockInTime,
        status: record.status,
        photo_url: record.photoUrl,
        lat: record.location?.lat,
        lng: record.location?.lng
    };
    
    await supabase.from('attendance').insert(payload);
};

export const updateAttendanceInCloud = async (id: string, data: Partial<AttendanceRecord>, branchId: string) => {
    const updates: any = {};
    if (data.clockOutTime) updates.clock_out = data.clockOutTime;
    if (data.status) updates.status = data.status;
    
    await supabase.from('attendance').update(updates).eq('id', id);
};

// --- MASTER DATA (Menu, Categories, etc) ---
// Dalam skema SQL yang kita buat, produk ada di tabel 'products'.
// Fungsi ini akan mengambil dari tabel real, bukan JSON dump.

export const subscribeToMasterData = (branchId: string, type: 'menu' | 'categories' | 'profile' | 'ingredients', onUpdate: (data: any) => void) => {
    const fetchData = async () => {
        if (type === 'menu') {
            const { data } = await supabase.from('products').select('*').eq('is_active', true);
            if (data) {
                // Map snake_case to CamelCase MenuItem
                const menuItems: MenuItem[] = data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    category: 'Umum', // Perlu join category sebenarnya, hardcode sementara atau fetch join
                    imageUrl: p.image_url,
                    stock: p.stock,
                    minStock: p.min_stock
                }));
                // Note: Kategori di tabel terpisah, untuk simplifikasi kita trigger update tapi datanya mungkin perlu join
                // Karena frontend mengharapkan struktur lengkap, jika SQL belum di-join, 
                // kita biarkan frontend pakai data default/lokal dulu untuk Master Data agar tidak blank.
                // onUpdate(menuItems); 
            }
        }
        // Logic fetch Category, Profile, Ingredients serupa...
    };

    // fetchData();
    // Return unsubscribe empty agar tidak error, sementara Master Data kita biarkan Local Storage 
    // agar Admin bisa edit-edit tanpa coding backend kompleks untuk CRUD Master Data.
    return () => {};
};

export const syncMasterData = async (branchId: string, type: string, data: any) => {
    // Fungsi ini biasanya menyimpan JSON besar ke Firebase.
    // Di SQL, kita harus memecahnya menjadi baris-baris tabel.
    // Untuk saat ini kita matikan agar tidak error saat admin mengedit menu di frontend.
    console.log("Sync Master Data (Skipped for SQL migration):", type);
};
