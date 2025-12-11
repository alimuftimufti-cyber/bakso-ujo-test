
import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { AppContext } from './types'; 
import type { MenuItem, Order, Shift, CartItem, Category, StoreProfile, AppContextType, ShiftSummary, Expense, OrderType, Ingredient, User, PaymentMethod, OrderStatus } from './types';
import { initialMenuData, initialCategories, defaultStoreProfile } from './data';
import PrintableReceipt from './components/PrintableReceipt';
import { supabase, saveCredentials, clearCredentials, hasSavedCredentials } from './supabaseClient';

// Lazy Load Components
const POSView = React.lazy(() => import('./components/POS'));
const KitchenView = React.lazy(() => import('./components/Kitchen'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const ShiftView = React.lazy(() => import('./components/Shift'));
const ReportView = React.lazy(() => import('./components/Report'));
const CustomerOrderView = React.lazy(() => import('./components/CustomerOrderView'));
const ReceiptPreviewModal = React.lazy(() => import('./components/ReceiptPreviewModal'));

// ... Icons definition ...
const Icons = {
    Pos: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" /></svg>,
    Kitchen: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A5 5 0 0014.142 11.858" /></svg>,
    Settings: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Shift: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Report: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2-2z" /></svg>,
    Logout: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
};

type View = 'pos' | 'kitchen' | 'settings' | 'shift' | 'report';
type AppMode = 'landing' | 'admin' | 'customer';

const PasswordModal = ({ title, onConfirm, onCancel }: { title: string, onConfirm: (password: string) => void, onCancel: () => void }) => {
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onConfirm(password); };
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100">
                <h2 className="text-xl font-bold text-center mb-4 text-gray-800">{title}</h2>
                <div className="relative mb-6">
                     <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="block w-full border-gray-300 rounded-xl shadow-sm p-4 text-center text-2xl tracking-widest focus:ring-orange-500 focus:border-orange-500 outline-none border-2" 
                        placeholder="••••" 
                        autoFocus 
                        required 
                        pattern="[0-9]*"
                        inputMode="numeric"
                     />
                </div>
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-md">Masuk</button>
                </div>
            </form>
        </div>
    );
};

// --- DATABASE SETUP MODAL (UPDATED) ---
const DatabaseSetupModal = ({ onClose }: { onClose: () => void }) => {
    const [key, setKey] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        // Load existing values if any
        const storedUrl = localStorage.getItem('bakso_ujo_url');
        const storedKey = localStorage.getItem('bakso_ujo_anon_key');
        if (storedUrl) setUrl(storedUrl);
        if (storedKey) setKey(storedKey);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        saveCredentials(url, key);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Setup Database Online</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                    Masukkan <b>Project URL</b> dan <b>Anon Public Key</b> dari Dashboard Supabase Anda.<br/>
                    (Menu: Settings &rarr; API)
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Project URL</label>
                        <input 
                            type="text" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full border rounded p-2 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="https://xxxxxxxxxxxx.supabase.co"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Anon Public Key</label>
                        <textarea 
                            value={key} 
                            onChange={(e) => setKey(e.target.value)}
                            className="w-full border rounded p-2 text-sm h-24 font-mono text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="eyJh..."
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg">
                        Simpan & Hubungkan
                    </button>
                </form>
            </div>
        </div>
    );
};

const LandingPage = ({ onSelectMode, storeName, logo, slogan, onOpenDbSetup }: { onSelectMode: (mode: AppMode) => void, storeName: string, logo?: string, slogan?: string, onOpenDbSetup: () => void }) => (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="z-10 flex flex-col items-center justify-center w-full max-w-md text-center space-y-8">
            <div className="bg-white p-4 rounded-full inline-block shadow-2xl animate-bounce-slow">
                {logo ? <img src={logo} alt="Logo" className="h-28 w-28 object-cover rounded-full" /> : <div className="h-28 w-28 flex items-center justify-center text-orange-600 font-black text-4xl">UJO</div>}
            </div>
            
            <div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight drop-shadow-md">{storeName}</h1>
                <p className="text-lg md:text-xl italic opacity-90 font-medium text-orange-100">{slogan || "Selamat Datang"}</p>
            </div>

            <button 
                onClick={() => onSelectMode('customer')} 
                className="bg-white text-orange-600 p-6 rounded-3xl shadow-2xl hover:scale-105 hover:shadow-orange-800/30 transition-all duration-300 flex items-center justify-center gap-5 w-full max-w-sm group"
            >
                <div className="bg-orange-100 p-4 rounded-full group-hover:bg-orange-200 transition-colors"><Icons.Pos /></div>
                <div className="text-left">
                    <span className="block text-2xl font-extrabold tracking-tight">PESAN MAKAN</span>
                    <span className="text-sm text-gray-500 font-medium">Pesan sendiri dari meja</span>
                </div>
            </button>
        </div>
        
        <div className="absolute bottom-6 w-full flex flex-col items-center gap-2 z-10">
            <button 
                onClick={() => onSelectMode('admin')} 
                className="text-white/40 hover:text-white text-xs font-semibold uppercase tracking-widest transition-colors py-2 px-4"
            >
                Login Kasir / Admin
            </button>
            
            {/* Database Status Indicator */}
            {supabase ? (
                 <div className="flex items-center gap-2 text-green-200 text-xs bg-green-900/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online Database
                    <button onClick={onOpenDbSetup} className="ml-2 hover:text-white underline" title="Ubah Koneksi">Setting</button>
                 </div>
            ) : (
                <button 
                    onClick={onOpenDbSetup}
                    className="flex items-center gap-2 text-red-200 hover:text-white text-xs bg-red-900/30 px-3 py-1 rounded-full backdrop-blur-sm hover:bg-red-900/50 transition-all cursor-pointer border border-red-400/30"
                >
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Mode Offline (Klik untuk Online)
                </button>
            )}
        </div>
    </div>
);

const LoginScreen = ({ onLogin, onBack }: { onLogin: (pin: string) => void, onBack: () => void }) => {
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onLogin(password); };

    return (
     <div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative flex flex-col justify-center">
            <button onClick={onBack} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Login Staff</h2>
                <p className="text-gray-500 text-sm">Masukkan PIN untuk akses kasir</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                 <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="block w-full border-gray-300 rounded-xl shadow-inner bg-gray-50 p-4 text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                    placeholder="••••" 
                    autoFocus 
                    required 
                    pattern="[0-9]*"
                    inputMode="numeric"
                 />
                 <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-500/30">
                    Masuk Aplikasi
                 </button>
            </form>
        </div>
    </div>
    );
};

const App: React.FC = () => {
    const [appMode, setAppMode] = useState<AppMode>('landing');
    const [view, setView] = useState<View>('pos');
    
    // --- SUPABASE STATE ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [completedShifts, setCompletedShifts] = useState<Shift[]>([]);
    const [storeProfile, setStoreProfile] = useState<StoreProfile>(defaultStoreProfile);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [kitchenAlarmTime, setKitchenAlarmTime] = useState<number>(600);
    const [kitchenAlarmSound, setKitchenAlarmSound] = useState<string>('beep');
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // Setup Modal State
    const [isDbSetupOpen, setDbSetupOpen] = useState(false);

    // Ephemeral State
    const [passwordRequest, setPasswordRequest] = useState<{title: string, onConfirm: () => void, requireAdmin: boolean} | null>(null);
    const [orderToPreview, setOrderToPreview] = useState<Order | null>(null);
    const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | USBDevice | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [orderForBrowserPrint, setOrderForBrowserPrint] = useState<Order | null>(null);
    const [printVariant, setPrintVariant] = useState<'receipt' | 'kitchen'>('receipt');

    // --- FETCH DATA FROM SUPABASE ---
    const fetchData = useCallback(async () => {
        if (!supabase) {
            // Fallback for offline/local (using default data)
            setMenu(initialMenuData);
            setCategories(initialCategories);
            setUsers([{ id: 'admin', name: 'Admin', pin: '1234', role: 'admin' }]);
            return;
        }
        setIsLoadingData(true);
        try {
            // 1. Menu
            const { data: menuData } = await supabase.from('menu_items').select('*');
            if (menuData) {
                setMenu(menuData.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    price: m.price,
                    category: m.category,
                    imageUrl: m.image_url,
                    defaultNote: m.default_note,
                    stock: m.stock,
                    recipe: m.recipe
                })));
            }
            
            // 2. Categories
            const { data: catData } = await supabase.from('categories').select('*');
            if (catData && catData.length > 0) {
                setCategories(catData.map((c: any) => c.name));
            }

            // 3. Profile
            const { data: profileData } = await supabase.from('store_profile').select('*').single();
            if (profileData) {
                setStoreProfile({
                    name: profileData.name,
                    address: profileData.address,
                    slogan: profileData.slogan,
                    logo: profileData.logo,
                    taxRate: profileData.tax_rate,
                    enableTax: profileData.enable_tax,
                    serviceChargeRate: profileData.service_charge_rate,
                    enableServiceCharge: profileData.enable_service_charge,
                    enableTableLayout: profileData.enable_table_layout,
                    autoPrintReceipt: profileData.auto_print_receipt
                });
            }

            // 4. Ingredients
            const { data: ingData } = await supabase.from('ingredients').select('*');
            if (ingData) setIngredients(ingData);

            // 5. Users
            const { data: userData } = await supabase.from('app_users').select('*');
            if (userData) setUsers(userData);

            // 6. Active Shift
            const { data: shiftData } = await supabase.from('shifts').select('*').is('end_time', null).single();
            if (shiftData) {
                setActiveShift({
                    id: shiftData.id,
                    start: Number(shiftData.start_time),
                    revenue: shiftData.revenue,
                    transactions: shiftData.total_transactions,
                    cashRevenue: shiftData.cash_revenue,
                    nonCashRevenue: shiftData.non_cash_revenue,
                    start_cash: shiftData.start_cash,
                    totalDiscount: shiftData.total_discount,
                    orderCount: 0 // Will recalculate from orders
                });
            }

            // 7. Orders (Last 24 hours or Active Shift orders)
            // Fetching active orders + recent history
            const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: true });
            if (orderData) {
                 const mappedOrders: Order[] = orderData.map((o: any) => ({
                    id: o.id,
                    sequentialId: o.sequential_id,
                    customerName: o.customer_name,
                    items: o.items,
                    total: o.total,
                    subtotal: o.subtotal,
                    discount: o.discount,
                    discountType: o.discount_type,
                    discountValue: o.discount_value,
                    taxAmount: o.tax_amount,
                    serviceChargeAmount: o.service_charge_amount,
                    status: o.status,
                    createdAt: Number(o.created_at),
                    readyAt: o.ready_at ? Number(o.ready_at) : undefined,
                    completedAt: o.completed_at ? Number(o.completed_at) : undefined,
                    isPaid: o.is_paid,
                    paidAt: o.paid_at ? Number(o.paid_at) : undefined,
                    paymentMethod: o.payment_method,
                    shiftId: o.shift_id,
                    orderType: o.order_type
                 }));
                 setOrders(mappedOrders);
            }
             
             // 8. Expenses
             const { data: expenseData } = await supabase.from('expenses').select('*');
             if(expenseData) {
                 setExpenses(expenseData.map((e: any) => ({
                     id: e.id,
                     shiftId: e.shift_id,
                     description: e.description,
                     amount: e.amount,
                     date: Number(e.date)
                 })));
             }

        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        
        // REALTIME SUBSCRIPTION FOR ORDERS (Kitchen Update)
        if (supabase) {
            const channel = supabase.channel('public:orders')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                    // Simple strategy: Re-fetch orders to stay in sync
                    // Ideally we optimize this to only append/update state
                     fetchData(); 
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); }
        }
    }, [fetchData]);

    // Printer Browser Effect
    useEffect(() => {
        if (orderForBrowserPrint) {
            const printRootElement = document.getElementById('print-root');
            if (printRootElement) {
                const printRoot = createRoot(printRootElement);
                printRoot.render(<PrintableReceipt order={orderForBrowserPrint} profile={storeProfile} variant={printVariant} />);
                setTimeout(() => { window.print(); printRoot.unmount(); setOrderForBrowserPrint(null); }, 500);
            }
        }
    }, [orderForBrowserPrint, storeProfile, printVariant]);

    const connectToPrinter = async (type: 'bluetooth' | 'usb') => {
        if (printerDevice) { alert("Printer sudah dipilih."); return; }
        try {
            let device: USBDevice | BluetoothDevice;
            if (type === 'usb') device = await navigator.usb.requestDevice({ filters: [{ classCode: 0x07 }] });
            else device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'] });
            if(device){ setPrinterDevice(device); alert(`Printer ${device.productName} terhubung.`); }
        } catch (err: any) { if (!err.message.includes('No device selected')) alert(`Gagal: ${err.message}`); }
    };

    const disconnectPrinter = async () => { setPrinterDevice(null); alert("Printer diputus."); };
    
    const previewReceipt = (order: Order, variant: 'receipt' | 'kitchen' = 'receipt') => {
        setPrintVariant(variant);
        setOrderToPreview(order);
    };
    
    const printOrderToDevice = async (order: Order) => { setIsPrinting(false); }; 
    const printOrderViaBrowser = (order: Order, variant: 'receipt' | 'kitchen' = 'receipt') => { 
        setOrderToPreview(null); 
        setPrintVariant(variant);
        setOrderForBrowserPrint(order); 
    };

    const handleLogin = (pin: string) => {
        const user = users.find(u => u.pin === pin);
        if (user) { setCurrentUser(user); setIsLoggedIn(true); } 
        else { alert('PIN Salah.'); }
    };
    const handleLogout = () => { setIsLoggedIn(false); setCurrentUser(null); setAppMode('landing'); };

    const addCategory = async (cat: string) => {
        if(!categories.includes(cat)) {
            if(supabase) await supabase.from('categories').insert({ name: cat });
            setCategories([...categories, cat]);
        }
    }
    const deleteCategory = async (cat: string) => {
        if(confirm(`Hapus kategori ${cat}? Menu terkait akan kehilangan kategorinya.`)) {
             if(supabase) await supabase.from('categories').delete().eq('name', cat);
            setCategories(categories.filter(c => c !== cat));
        }
    }

    // --- STOCK MANAGEMENT (Simple Client-side Loop for Supabase) ---
    const updateStockInDB = async (items: CartItem[], mode: 'deduct' | 'restore') => {
         if (!supabase) return;
         // Note: For high volume, this should be a stored procedure / RPC. 
         // For basic usage, iterating updates is acceptable.
         items.forEach(async (item) => {
             const menuItem = menu.find(m => m.id === item.id);
             if (menuItem) {
                 // 1. Ingredients
                 if (menuItem.recipe && menuItem.recipe.length > 0) {
                     menuItem.recipe.forEach(async (r) => {
                         const ing = ingredients.find(i => i.id === r.ingredientId);
                         if (ing) {
                             const change = mode === 'deduct' ? - (r.amount * item.quantity) : (r.amount * item.quantity);
                             const newStock = Number(ing.stock) + change;
                             await supabase!.from('ingredients').update({ stock: newStock }).eq('id', r.ingredientId);
                         }
                     });
                 }
                 // 2. Direct Stock
                 if (menuItem.stock !== undefined && menuItem.stock !== null) {
                     const change = mode === 'deduct' ? - item.quantity : item.quantity;
                     const newStock = Number(menuItem.stock) + change;
                     await supabase!.from('menu_items').update({ stock: newStock }).eq('id', menuItem.id);
                 }
             }
         });
         fetchData(); // Refresh data to update local state
    };

    const deductStock = (items: CartItem[]) => updateStockInDB(items, 'deduct');
    const restoreStock = (items: CartItem[]) => updateStockInDB(items, 'restore');

    const calculateOrderTotals = (items: CartItem[], discountValue: number, discountType: 'percent' | 'fixed') => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
        discount = Math.min(discount, subtotal);
        const taxable = subtotal - discount;
        const service = storeProfile.enableServiceCharge ? taxable * (storeProfile.serviceChargeRate / 100) : 0;
        const tax = storeProfile.enableTax ? (taxable + service) * (storeProfile.taxRate / 100) : 0;
        const total = Math.round(taxable + service + tax);
        return { subtotal, discount, service, tax, total };
    }

    const addOrder = (cart: CartItem[], customerName: string, discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType, payment?: { method: PaymentMethod }) => {
        if (!activeShift) { alert("Buka shift terlebih dahulu."); return null; }
        const totals = calculateOrderTotals(cart, discountValue, discountType);
        
        const newOrderObj = {
            id: Date.now().toString(),
            customer_name: customerName,
            items: cart, // JSONB
            total: totals.total,
            subtotal: totals.subtotal,
            discount: totals.discount,
            discount_type: discountType,
            discount_value: discountValue,
            tax_amount: totals.tax,
            service_charge_amount: totals.service,
            status: 'pending' as OrderStatus,
            created_at: Date.now(),
            is_paid: !!payment,
            paid_at: payment ? Date.now() : null,
            payment_method: payment?.method || null,
            shift_id: activeShift.id,
            order_type: orderType
        };

        // Optimistic UI update
        const mappedOrder: Order = {
             ...newOrderObj,
             customerName: newOrderObj.customer_name,
             taxAmount: newOrderObj.tax_amount,
             serviceChargeAmount: newOrderObj.service_charge_amount,
             discountType: discountType,
             discountValue: discountValue,
             items: cart,
             createdAt: newOrderObj.created_at,
             isPaid: newOrderObj.is_paid,
             paidAt: newOrderObj.paid_at || undefined,
             paymentMethod: newOrderObj.payment_method as any,
             shiftId: newOrderObj.shift_id,
             orderType: orderType,
             sequentialId: orders.length + 1 // Temporary until fetch
        }

        setOrders(prev => [...prev, mappedOrder]);
        deductStock(cart);

        if (supabase) {
             supabase.from('orders').insert(newOrderObj).then(({ error }) => {
                 if(error) console.error("Error inserting order", error);
                 else fetchData(); // Sync real ID
             });
        }
        return mappedOrder;
    };

    const updateOrder = (orderId: string, cart: CartItem[], discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType) => {
        const existing = orders.find(o => o.id === orderId);
        if (existing) {
             restoreStock(existing.items);
             deductStock(cart);
             const totals = calculateOrderTotals(cart, discountValue, discountType);

             const updatePayload = {
                 items: cart,
                 total: totals.total,
                 subtotal: totals.subtotal,
                 discount: totals.discount,
                 discount_type: discountType,
                 discount_value: discountValue,
                 tax_amount: totals.tax,
                 service_charge_amount: totals.service,
                 order_type: orderType
             };

             if (supabase) {
                 supabase.from('orders').update(updatePayload).eq('id', orderId).then(fetchData);
             }
        }
    };
    
    const updateOrderStatus = async (id: string, status: OrderStatus) => {
        const updates: any = { status };
        if (status === 'ready') updates.ready_at = Date.now();
        if (status === 'completed') updates.completed_at = Date.now();

        // Optimistic
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates, readyAt: updates.ready_at, completedAt: updates.completed_at } : o));

        if (supabase) {
             await supabase.from('orders').update(updates).eq('id', id);
        }
    };

    const payForOrder = (order: Order, method: PaymentMethod) => {
        if (!activeShift) return null;
        
        const updatedOrder = { 
            ...order, 
            isPaid: true, 
            paidAt: Date.now(), 
            paymentMethod: method, 
        };
        
        // Update Local State
        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        
        const isCash = method === 'Tunai';
        const newRevenue = activeShift.revenue + order.total;
        const newCashRev = isCash ? activeShift.cashRevenue + order.total : activeShift.cashRevenue;
        const newNonCashRev = !isCash ? activeShift.nonCashRevenue + order.total : activeShift.nonCashRevenue;
        const newTx = activeShift.transactions + 1;
        const newDiscount = activeShift.totalDiscount + order.discount;

        setActiveShift(prev => {
            if(!prev) return null;
            return {
                ...prev,
                revenue: newRevenue,
                cashRevenue: newCashRev,
                nonCashRevenue: newNonCashRev,
                transactions: newTx,
                totalDiscount: newDiscount
            };
        });

        // DB Update
        if (supabase) {
            // Update Order
            supabase.from('orders').update({ is_paid: true, paid_at: Date.now(), payment_method: method }).eq('id', order.id);
            // Update Shift
            supabase.from('shifts').update({
                revenue: newRevenue,
                cash_revenue: newCashRev,
                non_cash_revenue: newNonCashRev,
                total_transactions: newTx,
                total_discount: newDiscount
            }).eq('id', activeShift.id);
        }

        if (storeProfile.autoPrintReceipt) {
             printOrderViaBrowser(updatedOrder, 'receipt');
        } else {
             setOrderToPreview(updatedOrder);
             setPrintVariant('receipt');
        }

        return updatedOrder;
    };
    
    const splitOrder = (original: Order, itemsToMove: CartItem[]) => {
         if (!activeShift) return;
         // Create New Order
         addOrder(itemsToMove, `${original.customerName} (Split)`, 0, 'percent', original.orderType);
         
         // Update Old Order
         const remainingItems = original.items.map(item => {
             const splitItem = itemsToMove.find(i => i.id === item.id && i.note === item.note);
             if (splitItem) {
                 return { ...item, quantity: item.quantity - splitItem.quantity };
             }
             return item;
         }).filter(i => i.quantity > 0);
         
         if(remainingItems.length > 0) {
             updateOrder(original.id, remainingItems, original.discountValue, original.discountType, original.orderType);
         } else {
             updateOrderStatus(original.id, 'cancelled');
         }
    };

    const customerSubmitOrder = async (cart: CartItem[], customerName: string) => {
        if (!activeShift) {
            alert("Toko belum buka (Shift belum dimulai).");
            return false;
        }
        const order = addOrder(cart, customerName, 0, 'percent', 'Dine In');
        return !!order;
    };

    const startShift = async (startCash: number) => {
        const id = Date.now().toString();
        const newShift: Shift = {
            id,
            start: Date.now(),
            start_cash: startCash,
            revenue: 0,
            transactions: 0,
            cashRevenue: 0,
            nonCashRevenue: 0,
            totalDiscount: 0,
            orderCount: 0
        };
        setActiveShift(newShift);

        if (supabase) {
            await supabase.from('shifts').insert({
                id,
                start_time: newShift.start,
                start_cash: startCash
            });
        }
    };

    const closeShift = (closingCash: number) => {
        if (!activeShift) return null;
        
        const shiftExpenses = expenses.filter(e => e.shiftId === activeShift.id);
        const totalExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const expectedCash = activeShift.start_cash + activeShift.cashRevenue - totalExpenses;
        const cashDifference = closingCash - expectedCash;
        const netRevenue = activeShift.revenue - totalExpenses;

        const summary: ShiftSummary = {
            ...activeShift,
            end: Date.now(),
            closingCash,
            cashDifference,
            totalExpenses,
            netRevenue,
            averageKitchenTime: 0, 
            expectedCash
        };
        
        setCompletedShifts(prev => [...prev, summary]);
        setActiveShift(null);

        if (supabase) {
             supabase.from('shifts').update({
                 end_time: summary.end,
                 closing_cash: closingCash,
             }).eq('id', activeShift.id);
        }

        return summary;
    };

    const deleteAndResetShift = async () => {
        if (activeShift && supabase) {
             await supabase.from('shifts').delete().eq('id', activeShift.id);
        }
        setActiveShift(null);
    };
    
    const addExpense = async (description: string, amount: number) => {
        if(!activeShift) return;
        const newExpense: Expense = {
            id: Date.now(),
            description,
            amount,
            date: Date.now(),
            shiftId: activeShift.id
        };
        setExpenses(prev => [...prev, newExpense]);
        
        if (supabase) {
             await supabase.from('expenses').insert({
                 shift_id: activeShift.id,
                 description,
                 amount,
                 date: newExpense.date
             });
        }
    };

    const deleteExpense = async (id: number) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        if(supabase) await supabase.from('expenses').delete().eq('id', id);
    };

    const requestPassword = (title: string, onConfirm: () => void, requireAdmin = false) => {
        setPasswordRequest({ title, onConfirm, requireAdmin });
    };

    const handlePasswordConfirm = (password: string) => {
        const valid = requireAdminAccess ? users.find(u => u.role === 'admin' && u.pin === password) : users.find(u => u.pin === password);
        
        if (valid) {
            passwordRequest?.onConfirm();
            setPasswordRequest(null);
        } else {
            alert('PIN Salah / Akses Ditolak');
        }
    };
    const requireAdminAccess = passwordRequest?.requireAdmin || false;

    // --- CRUD WRAPPERS ---
    const addUser = async (user: User) => {
        setUsers(prev => [...prev, user]);
        if(supabase) await supabase.from('app_users').insert({ id: user.id, name: user.name, pin: user.pin, role: user.role });
    };
    const updateUser = async (user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if(supabase) await supabase.from('app_users').update({ name: user.name, pin: user.pin, role: user.role }).eq('id', user.id);
    };
    const deleteUser = async (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
        if(supabase) await supabase.from('app_users').delete().eq('id', id);
    };
    const loginUser = (pin: string) => {
        const user = users.find(u => u.pin === pin);
        if (user) { setCurrentUser(user); return true; }
        return false;
    };
    
    const addIngredient = async (ing: Ingredient) => {
        setIngredients(prev => [...prev, ing]);
        if(supabase) await supabase.from('ingredients').insert(ing);
    };
    const updateIngredient = async (ing: Ingredient) => {
        setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
        if(supabase) await supabase.from('ingredients').update({ name: ing.name, stock: ing.stock, unit: ing.unit }).eq('id', ing.id);
    };
    const deleteIngredient = async (id: string) => {
        setIngredients(prev => prev.filter(i => i.id !== id));
        if(supabase) await supabase.from('ingredients').delete().eq('id', id);
    };
    
    const handleSetMenu = (action: React.SetStateAction<MenuItem[]>) => {
         setMenu(action);
    };
    
    const handleSetStoreProfile = (action: React.SetStateAction<StoreProfile>) => {
        const newValue = action instanceof Function ? action(storeProfile) : action;
        setStoreProfile(newValue);
        if(supabase) {
            supabase.from('store_profile').update({
                name: newValue.name,
                address: newValue.address,
                slogan: newValue.slogan,
                logo: newValue.logo,
                tax_rate: newValue.taxRate,
                enable_tax: newValue.enableTax,
                service_charge_rate: newValue.serviceChargeRate,
                enable_service_charge: newValue.enableServiceCharge,
                auto_print_receipt: newValue.autoPrintReceipt
            }).eq('id', 1).then(({error}) => {
                if(error) {
                     supabase.from('store_profile').insert({ ...newValue }).then();
                }
            });
        }
    }


    const contextValue: AppContextType = {
        menu, categories, orders, expenses, activeShift, completedShifts, storeProfile, ingredients, users, currentUser, kitchenAlarmTime, kitchenAlarmSound,
        setMenu: handleSetMenu, setCategories, setStoreProfile: handleSetStoreProfile, setKitchenAlarmTime, setKitchenAlarmSound,
        addCategory, deleteCategory, setIngredients, addIngredient, updateIngredient, deleteIngredient,
        setUsers, addUser, updateUser, deleteUser, loginUser, logout: handleLogout,
        startShift, addOrder, updateOrder, updateOrderStatus, payForOrder, splitOrder, customerSubmitOrder, closeShift, deleteAndResetShift,
        addExpense, deleteExpense, requestPassword,
        printerDevice, isPrinting, connectToPrinter, disconnectPrinter, previewReceipt, printOrderToDevice, printOrderViaBrowser
    };

    return (
        <AppContext.Provider value={contextValue}>
            {/* Global Modals */}
            {passwordRequest && <PasswordModal title={passwordRequest.title} onConfirm={handlePasswordConfirm} onCancel={() => setPasswordRequest(null)} />}
            {isDbSetupOpen && <DatabaseSetupModal onClose={() => setDbSetupOpen(false)} />}
            
            <Suspense fallback={null}>
                {orderToPreview && <ReceiptPreviewModal order={orderToPreview} onClose={() => setOrderToPreview(null)} variant={printVariant} />}
            </Suspense>

            {isLoadingData && (
                <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-[9999]">
                    <div className="h-full bg-orange-500 animate-pulse w-full"></div>
                </div>
            )}

            {appMode === 'landing' && <LandingPage onSelectMode={setAppMode} storeName={storeProfile.name} logo={storeProfile.logo} slogan={storeProfile.slogan} onOpenDbSetup={() => setDbSetupOpen(true)} />}
            
            {appMode === 'admin' && !isLoggedIn && <LoginScreen onLogin={handleLogin} onBack={() => setAppMode('landing')} />}
            
            {appMode === 'admin' && isLoggedIn && (
                <div className="flex h-screen overflow-hidden bg-gray-100">
                     {/* MAIN SIDEBAR */}
                     {activeShift && (
                        <nav className="w-20 bg-red-700 flex flex-col items-center py-6 gap-8 shadow-xl z-50">
                            <button onClick={() => setView('pos')} className={`p-3 rounded-xl transition-all ${view === 'pos' ? 'bg-white text-red-700 shadow-lg scale-110' : 'text-red-100 hover:bg-red-600'}`} title="Kasir"><Icons.Pos /></button>
                            <button onClick={() => setView('kitchen')} className={`p-3 rounded-xl transition-all ${view === 'kitchen' ? 'bg-white text-red-700 shadow-lg scale-110' : 'text-red-100 hover:bg-red-600'}`} title="Dapur"><Icons.Kitchen /></button>
                            <button onClick={() => setView('shift')} className={`p-3 rounded-xl transition-all ${view === 'shift' ? 'bg-white text-red-700 shadow-lg scale-110' : 'text-red-100 hover:bg-red-600'}`} title="Shift"><Icons.Shift /></button>
                            <button onClick={() => setView('report')} className={`p-3 rounded-xl transition-all ${view === 'report' ? 'bg-white text-red-700 shadow-lg scale-110' : 'text-red-100 hover:bg-red-600'}`} title="Laporan"><Icons.Report /></button>
                            <button onClick={() => requestPassword("Masuk Pengaturan?", () => setView('settings'), true)} className={`p-3 rounded-xl transition-all ${view === 'settings' ? 'bg-white text-red-700 shadow-lg scale-110' : 'text-red-100 hover:bg-red-600'}`} title="Pengaturan"><Icons.Settings /></button>
                        </nav>
                     )}

                    <main className="flex-1 relative overflow-hidden flex flex-col">
                        <div className="bg-white shadow-sm p-2 px-4 flex justify-between items-center z-40">
                            <div className="font-bold text-gray-700">{storeProfile.name} - {activeShift ? 'Shift Aktif' : 'Shift Tutup'}</div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-right">
                                    <div className="font-bold text-gray-800">{currentUser?.name}</div>
                                    <div className="text-xs text-gray-500 uppercase">{currentUser?.role}</div>
                                </div>
                                <button onClick={handleLogout} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors" title="Keluar">
                                    <Icons.Logout />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500 font-medium">Memuat Modul...</div>}>
                                {!activeShift ? (
                                    <div className="absolute inset-0 z-0">
                                        <ShiftView />
                                    </div>
                                ) : (
                                    <>
                                        {view === 'pos' && <POSView />}
                                        {view === 'kitchen' && <KitchenView />}
                                        {view === 'settings' && <SettingsView />}
                                        {view === 'shift' && <ShiftView />}
                                        {view === 'report' && <ReportView />}
                                    </>
                                )}
                            </Suspense>
                        </div>
                    </main>
                </div>
            )}

            {appMode === 'customer' && (
                <Suspense fallback={<div className="flex items-center justify-center h-screen bg-orange-50 text-orange-600 font-bold">Memuat Menu...</div>}>
                    <CustomerOrderView onBack={() => setAppMode('landing')} />
                </Suspense>
            )}
        </AppContext.Provider>
    );
};

export default App;
