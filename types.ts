import React, { createContext, useContext } from 'react';

// --- GLOBAL DEVICE TYPES (Web Bluetooth & USB) ---
declare global {
    interface USBDevice {
        productName?: string;
        opened: boolean;
        configuration: USBConfiguration | null;
        reset(): Promise<void>;
        open(): Promise<void>;
        selectConfiguration(configurationValue: number): Promise<void>;
        claimInterface(interfaceNumber: number): Promise<void>;
        releaseInterface(interfaceNumber: number): Promise<void>;
        transferOut(endpointNumber: number, data: BufferSource): Promise<any>;
        close(): Promise<void>;
    }
    interface USBConfiguration { interfaces: USBInterface[]; }
    interface USBInterface { interfaceNumber: number; alternate: USBAlternateInterface; claimed: boolean; }
    interface USBAlternateInterface { endpoints: USBEndpoint[]; }
    interface USBEndpoint { endpointNumber: number; direction: 'in' | 'out'; }
    interface BluetoothDevice { productName?: string; gatt?: BluetoothRemoteGATTServer; }
    interface BluetoothRemoteGATTServer { connected: boolean; connect(): Promise<BluetoothRemoteGATTServer>; disconnect(): void; getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>; }
    interface BluetoothRemoteGATTService { getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>; }
    interface BluetoothRemoteGATTCharacteristic { writeValueWithoutResponse(value: BufferSource): Promise<void>; }
    interface Navigator {
        bluetooth: { requestDevice(options?: any): Promise<BluetoothDevice>; };
        usb: { requestDevice(options?: any): Promise<USBDevice>; };
    }
}

// --- CORE TYPES ---
export type Category = string;

export interface Ingredient {
    id: string;
    name: string;
    unit: string; // 'gram', 'ml', 'pcs', 'porsi'
    stock: number;
}

export interface RecipeItem {
    ingredientId: string;
    amount: number;
}

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: Category;
    imageUrl?: string;
    defaultNote?: string;
    recipe?: RecipeItem[];
    stock?: number; // Direct stock for non-recipe items (e.g. Kerupuk)
}

export interface CartItem extends MenuItem {
    quantity: number;
    note: string;
}

// --- ORDER TYPES ---
export type OrderStatus = 'pending' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'Dine In' | 'Take Away';
export type PaymentMethod = 'Tunai' | 'QRIS' | 'Debit';

export interface Order {
    id: string;
    customerName: string;
    items: CartItem[];
    
    // Financials
    total: number; // Grand Total (Net)
    subtotal: number; // Sum of items
    discount: number; // Nominal Value applied
    discountType: 'percent' | 'fixed'; 
    discountValue: number; // Input value (e.g. 10 for 10%)
    taxAmount: number;
    serviceChargeAmount: number;

    status: OrderStatus;
    createdAt: number;
    readyAt?: number;
    completedAt?: number;
    
    isPaid: boolean;
    paidAt?: number;
    paymentMethod?: PaymentMethod;
    
    shiftId: string;
    orderType: OrderType;
    sequentialId?: number;
}

export interface Expense {
    id: number;
    description: string;
    amount: number;
    date: number;
    shiftId: string;
}

export interface Shift {
    id: string;
    start: number;
    end?: number;
    revenue: number; 
    transactions: number;
    cashRevenue: number;
    nonCashRevenue: number;
    start_cash: number;
    totalDiscount: number;
    closingCash?: number;
    cashDifference?: number;
    orderCount?: number;
}

export interface ShiftSummary extends Shift {
    averageKitchenTime: number;
    totalExpenses: number;
    netRevenue: number;
    expectedCash: number; // Calculated: Start + CashRevenue - Expenses
}

// --- USER & STORE TYPES ---
export type UserRole = 'admin' | 'cashier' | 'kitchen';

export interface User {
    id: string;
    name: string;
    pin: string;
    role: UserRole;
}

export interface StoreProfile {
    name: string;
    address: string;
    logo?: string;
    slogan?: string;
    
    // Tax & Service Settings
    taxRate: number;
    enableTax: boolean;
    serviceChargeRate: number;
    enableServiceCharge: boolean;
    
    enableTableLayout: boolean;
    autoPrintReceipt: boolean; 
}

// --- CONTEXT INTERFACE ---
export interface AppContextType {
    // Data State
    menu: MenuItem[];
    categories: Category[];
    orders: Order[];
    expenses: Expense[];
    activeShift: Shift | null;
    completedShifts: Shift[];
    storeProfile: StoreProfile;
    ingredients: Ingredient[];
    users: User[];
    currentUser: User | null;
    kitchenAlarmTime: number;
    kitchenAlarmSound: string;

    // Setters & Actions
    setMenu: React.Dispatch<React.SetStateAction<MenuItem[]>>;
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    setStoreProfile: React.Dispatch<React.SetStateAction<StoreProfile>>;
    setKitchenAlarmTime: React.Dispatch<React.SetStateAction<number>>;
    setKitchenAlarmSound: React.Dispatch<React.SetStateAction<string>>;
    
    // Categories
    addCategory: (cat: string) => void;
    deleteCategory: (cat: string) => void;

    // Inventory
    setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
    addIngredient: (ing: Ingredient) => void;
    updateIngredient: (ing: Ingredient) => void;
    deleteIngredient: (id: string) => void;

    // Users
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    loginUser: (pin: string) => boolean;
    logout: () => void;

    // Order Logic
    startShift: (startCash: number) => void;
    addOrder: (cart: CartItem[], customerName: string, discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType, payment?: { method: PaymentMethod }) => Order | null;
    updateOrder: (orderId: string, cart: CartItem[], discountValue: number, discountType: 'percent' | 'fixed', orderType: OrderType) => void;
    updateOrderStatus: (id: string, status: OrderStatus) => void;
    payForOrder: (order: Order, method: PaymentMethod) => Order | null;
    splitOrder: (original: Order, itemsToMove: CartItem[]) => void;
    customerSubmitOrder: (cart: CartItem[], customerName: string) => Promise<boolean>;
    closeShift: (cash: number) => ShiftSummary | null;
    deleteAndResetShift: () => void;
    
    // Expenses
    addExpense: (description: string, amount: number) => void;
    deleteExpense: (id: number) => void;
    
    // Security
    requestPassword: (title: string, onConfirm: () => void, requireAdmin?: boolean) => void;
    
    // Printer
    printerDevice: BluetoothDevice | USBDevice | null;
    isPrinting: boolean;
    connectToPrinter: (type: 'bluetooth' | 'usb') => Promise<void>;
    disconnectPrinter: () => Promise<void>;
    previewReceipt: (order: Order, variant?: 'receipt' | 'kitchen') => void;
    printOrderToDevice: (order: Order) => Promise<void>;
    printOrderViaBrowser: (order: Order, variant?: 'receipt' | 'kitchen') => void;
}

// --- CONTEXT IMPLEMENTATION ---
export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};