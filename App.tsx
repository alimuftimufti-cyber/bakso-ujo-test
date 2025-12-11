
import React, { useState, useEffect, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { AppContext } from './types'; // Import Context from types
import type { MenuItem, Order, Shift, CartItem, Category, StoreProfile, AppContextType, ShiftSummary, Expense, OrderType, Ingredient, User, PaymentMethod, OrderStatus } from './types';
import { initialMenuData, initialCategories, defaultStoreProfile } from './data';
import PrintableReceipt from './components/PrintableReceipt';

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

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { console.error(error); return initialValue; }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.error(error); }
    };
    return [storedValue, setValue];
}

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

const LandingPage = ({ onSelectMode, storeName, logo, slogan }: { onSelectMode: (mode: AppMode) => void, storeName: string, logo?: string, slogan?: string }) => (
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
        
        <div className="absolute bottom-6 w-full text-center z-10">
            <button 
                onClick={() => onSelectMode('admin')} 
                className="text-white/40 hover:text-white text-xs font-semibold uppercase tracking-widest transition-colors py-2 px-4"
            >
                Login Kasir / Admin
            </button>
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

// --- DATABASE VERSION KEY (BUMP TO RESET) ---
const DB_VER = 'v16_stable';

const App: React.FC = () => {
    const [appMode, setAppMode] = useState<AppMode>('landing');
    const [view, setView] = useState<View>('pos');
    
    // Data State
    const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>(`pos-isLoggedIn-${DB_VER}`, false);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>(`pos-currentUser-${DB_VER}`, null);
    const [menu, setMenu] = useLocalStorage<MenuItem[]>(`pos-menu-${DB_VER}`, initialMenuData);
    const [categories, setCategories] = useLocalStorage<Category[]>(`pos-categories-${DB_VER}`, initialCategories);
    const [orders, setOrders] = useLocalStorage<Order[]>(`pos-orders-${DB_VER}`, []);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>(`pos-expenses-${DB_VER}`, []);
    const [activeShift, setActiveShift] = useLocalStorage<Shift | null>(`pos-activeShift-${DB_VER}`, null);
    const [completedShifts, setCompletedShifts] = useLocalStorage<Shift[]>(`pos-completedShifts-${DB_VER}`, []);
    const [storeProfile, setStoreProfile] = useLocalStorage<StoreProfile>(`pos-storeProfile-${DB_VER}`, defaultStoreProfile);
    const [ingredients, setIngredients] = useLocalStorage<Ingredient[]>(`pos-ingredients-${DB_VER}`, []);
    const [users, setUsers] = useLocalStorage<User[]>(`pos-users-${DB_VER}`, [
        { id: 'admin', name: 'Admin', pin: '1234', role: 'admin' },
        { id: 'cashier1', name: 'Kasir 1', pin: '1111', role: 'cashier' }
    ]);
    const [kitchenAlarmTime, setKitchenAlarmTime] = useLocalStorage<number>(`pos-kitchenAlarmTime-${DB_VER}`, 600);
    const [kitchenAlarmSound, setKitchenAlarmSound] = useLocalStorage<string>(`pos-kitchenAlarmSound-${DB_VER}`, 'beep');

    // Ephemeral State
    const [passwordRequest, setPasswordRequest] = useState<{title: string, onConfirm: () => void, requireAdmin: boolean} | null>(null);
    const [orderToPreview, setOrderToPreview] = useState<Order | null>(null);
    const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | USBDevice | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [orderForBrowserPrint, setOrderForBrowserPrint] = useState<Order | null>(null);
    const [printVariant, setPrintVariant] = useState<'receipt' | 'kitchen'>('receipt');

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

    const addCategory = (cat: string) => {
        if(!categories.includes(cat)) setCategories([...categories, cat]);
    }
    const deleteCategory = (cat: string) => {
        if(confirm(`Hapus kategori ${cat}? Menu terkait akan kehilangan kategorinya.`)) {
            setCategories(categories.filter(c => c !== cat));
        }
    }

    const deductStock = (items: CartItem[]) => {
        const deductions = new Map<string, number>();
        const productDeductions = new Map<number, number>();

        items.forEach(item => {
            const menuItem = menu.find(m => m.id === item.id);
            if (menuItem) {
                if (menuItem.recipe && menuItem.recipe.length > 0) {
                    menuItem.recipe.forEach(r => deductions.set(r.ingredientId, (deductions.get(r.ingredientId) || 0) + r.amount * item.quantity));
                }
                if (menuItem.stock !== undefined) {
                    productDeductions.set(menuItem.id, (productDeductions.get(menuItem.id) || 0) + item.quantity);
                }
            }
        });

        setIngredients(prev => prev.map(ing => {
            const amount = deductions.get(ing.id);
            return amount ? { ...ing, stock: ing.stock - amount } : ing;
        }));

        setMenu(prev => prev.map(m => {
            const deduction = productDeductions.get(m.id);
            return deduction ? { ...m, stock: (m.stock || 0) - deduction } : m;
        }));
    };

    const restoreStock = (items: CartItem[]) => {
        const restorations = new Map<string, number>();
        const productRestorations = new Map<number, number>();

        items.forEach(item => {
            const menuItem = menu.find(m => m.id === item.id);
            if (menuItem) {
                if (menuItem.recipe && menuItem.recipe.length > 0) {
                    menuItem.recipe.forEach(r => restorations.set(r.ingredientId, (restorations.get(r.ingredientId) || 0) + r.amount * item.quantity));
                }
                if (menuItem.stock !== undefined) {
                    productRestorations.set(menuItem.id, (productRestorations.get(menuItem.id) || 0) + item.quantity);
                }
            }
        });

        setIngredients(prev => prev.map(ing => {
            const amount = restorations.get(ing.id);
            return amount ? { ...ing, stock: ing.stock + amount } : ing;
        }));

        setMenu(prev => prev.map(m => {
            const restoration = productRestorations.get(m.id);
            return restoration ? { ...m, stock: (m.stock || 0) + restoration } : m;
        }));
    };

    const calculateOrderTotals = (items: CartItem[], discountValue: number, discountType: 'percent' | 'fixed') => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discount = discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue;
        discount = Math.min(discount, subtotal);
        const taxable = subtotal - discount;
        
        // CONDITIONAL CALCULATION
        const service = storeProfile.enableServiceCharge ? taxable * (storeProfile.serviceChargeRate / 100) : 0;
        const tax = storeProfile.enableTax ? (taxable + service) * (storeProfile.taxRate / 100) : 0;
        
        const total = Math.round(taxable + service + tax);
        return { subtotal, discount, service, tax, total };
    }

    const addOrder = (cart: CartItem[], customerName: string, discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType, payment?: { method: PaymentMethod }) => {
        if (!activeShift) { alert("Buka shift terlebih dahulu."); return null; }
        const totals = calculateOrderTotals(cart, discountValue, discountType);
        
        const shiftOrderCount = (activeShift.orderCount || 0) + 1;
        
        const newOrder: Order = {
            id: Date.now().toString(),
            sequentialId: shiftOrderCount,
            customerName,
            items: cart,
            total: totals.total,
            subtotal: totals.subtotal,
            discount: totals.discount,
            discountType,
            discountValue,
            taxAmount: totals.tax,
            serviceChargeAmount: totals.service,
            status: 'pending',
            createdAt: Date.now(),
            isPaid: !!payment,
            paidAt: payment ? Date.now() : undefined,
            paymentMethod: payment?.method,
            shiftId: activeShift.id,
            orderType
        };

        setOrders(prev => [...prev, newOrder]);
        setActiveShift(prev => prev ? { ...prev, orderCount: shiftOrderCount } : null);
        deductStock(cart);
        return newOrder;
    };

    const updateOrder = (orderId: string, cart: CartItem[], discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType) => {
        const existing = orders.find(o => o.id === orderId);
        if (existing) {
             restoreStock(existing.items);
             deductStock(cart);

             const totals = calculateOrderTotals(cart, discountValue, discountType);
             setOrders(prev => prev.map(o => o.id === orderId ? { 
                 ...o, 
                 items: cart, 
                 total: totals.total,
                 subtotal: totals.subtotal,
                 discount: totals.discount,
                 taxAmount: totals.tax,
                 serviceChargeAmount: totals.service,
                 discountValue, 
                 discountType, 
                 orderType 
            } : o));
        }
    };
    
    const updateOrderStatus = (id: string, status: OrderStatus) => {
        setOrders(prev => prev.map(o => {
            if (o.id === id) {
                const updates: Partial<Order> = { status };
                if (status === 'ready') updates.readyAt = Date.now();
                if (status === 'completed') updates.completedAt = Date.now();
                return { ...o, ...updates };
            }
            return o;
        }));
    };

    const payForOrder = (order: Order, method: PaymentMethod) => {
        if (!activeShift) return null;
        
        const updatedOrder = { 
            ...order, 
            isPaid: true, 
            paidAt: Date.now(), 
            paymentMethod: method, 
        };
        setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        
        const isCash = method === 'Tunai';
        setActiveShift(prev => {
            if(!prev) return null;
            return {
                ...prev,
                revenue: prev.revenue + order.total,
                cashRevenue: isCash ? prev.cashRevenue + order.total : prev.cashRevenue,
                nonCashRevenue: !isCash ? prev.nonCashRevenue + order.total : prev.nonCashRevenue,
                transactions: prev.transactions + 1,
                totalDiscount: prev.totalDiscount + order.discount
            };
        });

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
         const newOrder = addOrder(itemsToMove, `${original.customerName} (Split)`, 0, 'percent', original.orderType);
         
         if (newOrder) {
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

    const startShift = (startCash: number) => {
        const newShift: Shift = {
            id: Date.now().toString(),
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
        return summary;
    };

    const deleteAndResetShift = () => {
        setActiveShift(null);
    };
    
    const addExpense = (description: string, amount: number) => {
        if(!activeShift) return;
        const newExpense: Expense = {
            id: Date.now(),
            description,
            amount,
            date: Date.now(),
            shiftId: activeShift.id
        };
        setExpenses(prev => [...prev, newExpense]);
    };

    const deleteExpense = (id: number) => setExpenses(prev => prev.filter(e => e.id !== id));

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

    const addUser = (user: User) => setUsers(prev => [...prev, user]);
    const updateUser = (user: User) => setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
    const loginUser = (pin: string) => {
        const user = users.find(u => u.pin === pin);
        if (user) { setCurrentUser(user); return true; }
        return false;
    };
    
    const addIngredient = (ing: Ingredient) => setIngredients(prev => [...prev, ing]);
    const updateIngredient = (ing: Ingredient) => setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
    const deleteIngredient = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id));

    const contextValue: AppContextType = {
        menu, categories, orders, expenses, activeShift, completedShifts, storeProfile, ingredients, users, currentUser, kitchenAlarmTime, kitchenAlarmSound,
        setMenu, setCategories, setStoreProfile, setKitchenAlarmTime, setKitchenAlarmSound,
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
            
            <Suspense fallback={null}>
                {orderToPreview && <ReceiptPreviewModal order={orderToPreview} onClose={() => setOrderToPreview(null)} variant={printVariant} />}
            </Suspense>

            {appMode === 'landing' && <LandingPage onSelectMode={setAppMode} storeName={storeProfile.name} logo={storeProfile.logo} slogan={storeProfile.slogan} />}
            
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
