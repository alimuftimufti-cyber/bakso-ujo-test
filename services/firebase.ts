
import { supabase } from './supabaseClient';
import type { Order, AttendanceRecord, MenuItem, Category, StoreProfile, Ingredient, Branch, User } from '../types';

// --- STATUS KONEKSI ---
export const isFirebaseReady = true; 
export const currentProjectId = "Supabase Project";

// --- HELPERS ---
const handleError = (error: any, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error);
        console.warn(error.message);
    }
};

// --- SYNC PENDING DATA (Placeholder) ---
export const syncPendingData = async (branchId: string) => {
    // Logic sync jika perlu
};

// --- STORE STATUS ---
export const setStoreStatus = async (branchId: string, isOpen: boolean) => {
    // Opsional: Simpan status toko di DB
    console.log(`Set store ${branchId} status: ${isOpen}`);
};

export const subscribeToStoreStatus = (branchId: string, onUpdate: (isOpen: boolean) => void) => {
    onUpdate(true); // Default open
    return () => {};
};

// ==========================================
// 1. BRANCHES (CABANG)
// ==========================================

export const getBranchesFromCloud = async (): Promise<Branch[]> => {
    const { data, error } = await supabase.from('branches').select('*');
    handleError(error, 'getBranches');
    return data || [];
};

export const addBranchToCloud = async (branch: Branch) => {
    const { error } = await supabase.from('branches').insert({
        id: branch.id,
        name: branch.name,
        address: branch.address
    });
    handleError(error, 'addBranch');
};

export const deleteBranchFromCloud = async (id: string) => {
    const { error } = await supabase.from('branches').delete().eq('id', id);
    handleError(error, 'deleteBranch');
};

// ==========================================
// 2. USERS (PEGAWAI)
// ==========================================

export const getUsersFromCloud = async (branchId: string): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`branch_id.eq.${branchId},role.eq.owner`);
        
    handleError(error, 'getUsers');
    
    return (data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        pin: u.pin,
        attendancePin: u.attendance_pin,
        role: u.role as any,
        branchId: u.branch_id
    }));
};

export const addUserToCloud = async (user: User) => {
    const { error } = await supabase.from('users').insert({
        id: user.id,
        name: user.name,
        pin: user.pin,
        attendance_pin: user.attendancePin,
        role: user.role,
        branch_id: user.branchId
    });
    handleError(error, 'addUser');
};

export const deleteUserFromCloud = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    handleError(error, 'deleteUser');
};

export const updateUserInCloud = async (user: User) => {
    const { error } = await supabase.from('users').update({
        name: user.name,
        pin: user.pin,
        attendance_pin: user.attendancePin,
        role: user.role
    }).eq('id', user.id);
    handleError(error, 'updateUser');
};

// ==========================================
// 3. CATEGORIES
// ==========================================

export const getCategoriesFromCloud = async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('name');
    handleError(error, 'getCategories');
    return (data || []).map((c: any) => c.name);
};

export const addCategoryToCloud = async (name: string) => {
    const { error } = await supabase.from('categories').insert({ name });
    handleError(error, 'addCategory');
};

export const deleteCategoryFromCloud = async (name: string) => {
    const { error } = await supabase.from('categories').delete().eq('name', name);
    handleError(error, 'deleteCategory');
};

// ==========================================
// 4. MENU / PRODUCTS
// ==========================================

export const getMenuFromCloud = async (branchId: string): Promise<MenuItem[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            categories (name)
        `)
        .eq('is_active', true)
        .or(`branch_id.is.null,branch_id.eq.${branchId}`);

    handleError(error, 'getMenu');

    return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        category: p.categories?.name || 'Umum',
        imageUrl: p.image_url,
        stock: p.stock,
        minStock: p.min_stock
    }));
};

export const addProductToCloud = async (item: MenuItem, branchId: string) => {
    const { data: catData } = await supabase.from('categories').select('id').eq('name', item.category).single();
    
    if (!catData) {
        console.error("Kategori tidak ditemukan untuk produk:", item.name);
        return; 
    }

    const payload = {
        name: item.name,
        price: item.price,
        category_id: catData.id,
        image_url: item.imageUrl,
        stock: item.stock,
        min_stock: item.minStock,
        is_active: true,
        branch_id: null 
    };

    if (item.id && typeof item.id === 'number' && item.id < 1000000000) {
        await supabase.from('products').update(payload).eq('id', item.id);
    } else {
        await supabase.from('products').insert(payload);
    }
};

export const deleteProductFromCloud = async (id: number) => {
    await supabase.from('products').update({ is_active: false }).eq('id', id);
};

// ==========================================
// 5. ORDERS & TRANSACTIONS
// ==========================================

const mapToAppOrder = (dbOrder: any): Order => {
    return {
        id: dbOrder.id,
        sequentialId: dbOrder.sequential_id,
        customerName: dbOrder.customer_name,
        items: dbOrder.order_items ? dbOrder.order_items.map((i: any) => ({
            id: i.product_id,
            name: i.product_name,
            price: i.price,
            quantity: i.quantity,
            note: i.note,
            category: 'Uncategorized', 
        })) : [],
        total: dbOrder.total,
        subtotal: dbOrder.subtotal,
        discount: dbOrder.discount || 0,
        discountType: 'percent',
        discountValue: 0,
        taxAmount: dbOrder.tax || 0,
        serviceChargeAmount: dbOrder.service || 0,
        status: dbOrder.status,
        // created_at is BIGINT (ms) in DB schema
        createdAt: Number(dbOrder.created_at),
        completedAt: dbOrder.completed_at ? Number(dbOrder.completed_at) : undefined,
        // updated_at is TIMESTAMPZ, so new Date() parses it correctly
        paidAt: dbOrder.payment_status === 'paid' ? new Date(dbOrder.updated_at).getTime() : undefined,
        isPaid: dbOrder.payment_status === 'paid',
        paymentMethod: dbOrder.payment_method,
        shiftId: dbOrder.shift_id,
        orderType: dbOrder.type,
        branchId: dbOrder.branch_id
    };
};

export const subscribeToOrders = (branchId: string, onUpdate: (orders: Order[]) => void) => {
    if (!branchId) return () => {};

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items (*)`)
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            onUpdate(data.map(mapToAppOrder));
        }
    };

    fetchOrders();

    const channel = supabase
        .channel(`realtime-orders-${branchId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${branchId}` }, () => fetchOrders())
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

export const addOrderToCloud = async (order: Order) => {
    // 1. Insert Order Header
    // SCHEMA: created_at is BIGINT, send as number (timestamp ms)
    const { error: orderError } = await supabase.from('orders').insert({
        id: order.id,
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
        created_at: order.createdAt // Send number, not ISO String
    });

    if (orderError) {
        console.error("Add Order Error", orderError);
        return;
    }

    // 2. Insert Items
    const items = order.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note
    }));
    
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    if (itemsError) console.error("Add Order Items Error", itemsError);
};

export const updateOrderInCloud = async (orderId: string, data: Partial<Order>) => {
    const updates: any = {};
    if (data.status) updates.status = data.status;
    if (data.isPaid !== undefined) updates.payment_status = data.isPaid ? 'paid' : 'unpaid';
    if (data.paymentMethod) updates.payment_method = data.paymentMethod;
    // SCHEMA: completed_at is BIGINT
    if (data.completedAt) updates.completed_at = data.completedAt; 
    
    if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString(); // TIMESTAMPZ
        await supabase.from('orders').update(updates).eq('id', orderId);
    }
};

// ==========================================
// 6. ATTENDANCE
// ==========================================

export const subscribeToAttendance = (branchId: string, onUpdate: (data: AttendanceRecord[]) => void) => {
    const fetch = async () => {
        const { data } = await supabase.from('attendance').select('*').eq('branch_id', branchId).order('clock_in', { ascending: false });
        if (data) {
            onUpdate(data.map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                userName: r.user_name,
                branchId: r.branch_id,
                date: r.date,
                clockInTime: Number(r.clock_in), // BIGINT
                clockOutTime: r.clock_out ? Number(r.clock_out) : undefined, // BIGINT
                status: r.status,
                photoUrl: r.photo_url,
                location: r.lat ? { lat: r.lat, lng: r.lng } : undefined
            })));
        }
    };
    fetch();
    return () => {};
};

export const addAttendanceToCloud = async (record: AttendanceRecord) => {
    await supabase.from('attendance').insert({
        id: record.id,
        user_id: record.userId,
        user_name: record.userName,
        branch_id: record.branchId,
        date: record.date,
        clock_in: record.clockInTime, // BIGINT
        status: record.status,
        photo_url: record.photoUrl,
        lat: record.location?.lat,
        lng: record.location?.lng
    });
};

export const updateAttendanceInCloud = async (id: string, data: Partial<AttendanceRecord>, branchId: string) => {
    const updates: any = {};
    if (data.clockOutTime) updates.clock_out = data.clockOutTime; // BIGINT
    if (data.status) updates.status = data.status;

    await supabase.from('attendance').update(updates).eq('id', id);
};

export const subscribeToMasterData = (branchId: string, type: string, cb: any) => { return () => {} };
export const syncMasterData = async () => {};
