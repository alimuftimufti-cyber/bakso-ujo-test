
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../types'; 
import type { MenuItem, CartItem } from '../types';
import PrintableReceipt from './PrintableReceipt';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

// ... MenuItemCard, IdentificationModal, ConfirmationModal (unchanged) ...
const MenuItemCard: React.FC<{ item: MenuItem, onAdd: (item: MenuItem) => void }> = ({ item, onAdd }) => (
    <div onClick={() => onAdd(item)} className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 flex flex-col h-full relative group active:scale-95 transform">
        <div className="relative h-32 md:h-40 overflow-hidden bg-gray-100">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg></div>}
            {item.stock !== undefined && <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{item.stock}</div>}
        </div>
        <div className="p-3 flex flex-col flex-grow">
            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{item.name}</h3>
            <p className="text-orange-600 font-black text-sm mt-auto">{formatRupiah(item.price)}</p>
        </div>
    </div>
);

const IdentificationModal = ({ onConfirm, onBack }: { onConfirm: (name: string, table: string) => void, onBack: () => void }) => {
    const [name, setName] = useState('');
    const [table, setTable] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (name.trim() && table.trim()) { onConfirm(name, table); } };
    return (<div className="fixed inset-0 bg-gray-900/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div><button onClick={onBack} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button><div className="text-center mb-8"><div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div><h2 className="text-2xl font-bold text-gray-800">Mulai Pesanan</h2><p className="text-gray-500">Lengkapi data untuk memudahkan pengantaran.</p></div><form onSubmit={handleSubmit} className="space-y-5"><div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Meja</label><input type="text" value={table} onChange={(e) => setTable(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-lg font-bold text-center" placeholder="Contoh: 5" required autoFocus /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Anda</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-lg text-center" placeholder="Contoh: Budi" required /></div><button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5">Lanjut Pilih Menu</button></form></div></div>);
};

const ConfirmationModal = ({ total, itemCount, onConfirm, onCancel, isSubmitting }: { total: number, itemCount: number, onConfirm: () => void, onCancel: () => void, isSubmitting: boolean }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs"><h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Konfirmasi Pesanan?</h3><p className="text-gray-600 mb-6 text-center">Pesan <span className="font-extrabold text-gray-900">{itemCount} item</span> ?<br/>Total: <span className="font-extrabold text-orange-600 text-xl block mt-1">{formatRupiah(total)}</span></p><div className="space-y-3"><button onClick={onConfirm} disabled={isSubmitting} className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-colors flex justify-center items-center shadow-lg">{isSubmitting ? "Memproses..." : "Ya, Pesan Sekarang"}</button><button onClick={onCancel} disabled={isSubmitting} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">Periksa Lagi</button></div></div></div>
);

const CartDrawer = ({ 
    cart, 
    isOpen, 
    onClose, 
    onUpdateItem, 
    onUpdateNote,
    onCheckout,
    breakdown // New prop for financial breakdown
}: { 
    cart: CartItem[], 
    isOpen: boolean, 
    onClose: () => void, 
    onUpdateItem: (item: CartItem, change: number) => void,
    onUpdateNote: (itemId: number, note: string) => void,
    onCheckout: () => void,
    breakdown: { subtotal: number, service: number, tax: number, total: number }
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-[360px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right ml-auto">
                <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
                    <h2 className="text-lg font-extrabold text-gray-800">Keranjang Pesanan</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-32 bg-gray-50">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <p className="font-medium">Keranjang masih kosong</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex gap-3">
                                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800 line-clamp-2 text-sm leading-tight">{item.name}</h4>
                                            <span className="font-black text-gray-900 ml-2 text-sm">{formatRupiah(item.price * item.quantity)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200">
                                                <button onClick={() => onUpdateItem(item, -1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg font-bold text-lg">-</button>
                                                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                <button onClick={() => onUpdateItem(item, 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg font-bold text-lg">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <input type="text" placeholder="Catatan (cth: Pedas...)" value={item.note || ''} onChange={(e) => onUpdateNote(item.id, e.target.value)} className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-orange-300 focus:border-orange-300 outline-none transition-colors" />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 bg-white border-t shadow-[0_-4px_15px_rgba(0,0,0,0.08)] absolute bottom-0 w-full z-20">
                    <div className="space-y-1 mb-3 text-sm text-gray-600">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(breakdown.subtotal)}</span></div>
                        {breakdown.tax > 0 && <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(breakdown.tax)}</span></div>}
                        {breakdown.service > 0 && <div className="flex justify-between"><span>Service</span><span>{formatRupiah(breakdown.service)}</span></div>}
                        <div className="flex justify-between items-center text-base pt-2 border-t mt-2"><span className="font-bold text-gray-800">Total Pembayaran</span><span className="font-black text-orange-600 text-xl">{formatRupiah(breakdown.total)}</span></div>
                    </div>
                    
                    <button 
                        onClick={onCheckout} 
                        disabled={cart.length === 0}
                        className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg text-lg"
                    >
                        Pesan Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ onReset, cart, customerName, total }: { onReset: () => void, cart: CartItem[], customerName: string, total: number }) => {
    // ... same as before
    const [showReceipt, setShowReceipt] = useState(false);
    const { storeProfile } = useAppContext();
    const mockOrder: any = { id: 'PREVIEW', customerName: customerName, items: cart, total: total, discount: 0, subtotal: total, status: 'pending', createdAt: Date.now(), orderType: 'Dine In', isPaid: false };

    if (showReceipt) { return (<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><div className="bg-white rounded-lg shadow-2xl w-full max-w-xs flex flex-col h-[85vh]"><div className="p-3 border-b flex justify-between items-center bg-gray-50 rounded-t-lg"><h3 className="font-bold text-lg">Detail Pesanan</h3><button onClick={() => setShowReceipt(false)} className="text-2xl font-light text-gray-500 hover:text-black">&times;</button></div><div className="flex-1 overflow-y-auto p-2 bg-white"><PrintableReceipt order={mockOrder} profile={storeProfile} /></div><div className="p-4 bg-white border-t"><p className="text-xs text-gray-500 text-center mb-3">Silakan screenshot layar ini.</p><button onClick={() => setShowReceipt(false)} className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg shadow-lg">Tutup</button></div></div></div>) }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-scale-in relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Pesanan Masuk!</h2>
                <p className="text-gray-600 mb-8 font-medium">Mohon tunggu, pesanan Anda sedang disiapkan oleh dapur kami.</p>
                <div className="space-y-3"><button onClick={() => setShowReceipt(true)} className="bg-white border-2 border-orange-500 text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors w-full">Lihat Rincian / Screenshot</button><button onClick={onReset} className="bg-orange-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors w-full shadow-lg">Selesai / Pesan Lagi</button></div>
            </div>
        </div>
    );
};

const CustomerOrderView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { menu, categories, customerSubmitOrder, storeProfile } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerDetails, setCustomerDetails] = useState<{name: string, table: string} | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Updated Calculation Logic for Customer View
    const breakdown = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // CONDITIONAL LOGIC FOR TAX/SERVICE
        const service = storeProfile.enableServiceCharge ? subtotal * (storeProfile.serviceChargeRate / 100) : 0;
        const tax = storeProfile.enableTax ? (subtotal + service) * (storeProfile.taxRate / 100) : 0;
        
        const total = Math.round(subtotal + service + tax);
        return { subtotal, service, tax, total };
    }, [cart, storeProfile]);

    const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    const filteredMenu = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase();
        return menu.filter(item => 
            (activeCategory === 'All' || item.category === activeCategory) &&
            item.name.toLowerCase().includes(lowerTerm)
        );
    }, [menu, activeCategory, searchTerm]);

    const handleIdentification = (name: string, table: string) => { setCustomerDetails({ name, table }); };
    const handleAddToCart = (item: MenuItem) => { setCart(prev => { const existing = prev.find(i => i.id === item.id); if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { ...item, quantity: 1, note: '' }]; }); };
    const handleUpdateCartItem = (item: CartItem, change: number) => { setCart(prev => { const existing = prev.find(i => i.id === item.id); if (!existing) return prev; const newQty = existing.quantity + change; if (newQty <= 0) return prev.filter(i => i.id !== item.id); return prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i); }); };
    const handleUpdateCartItemNote = (itemId: number, note: string) => { setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i)); };
    const handleCheckoutClick = () => { setIsConfirmationOpen(true); }
    const handleSubmitOrder = async () => { if (!customerDetails) return; setIsSubmitting(true); try { const formattedName = `${customerDetails.name} (Meja ${customerDetails.table})`; const success = await customerSubmitOrder(cart, formattedName); if (success) { setIsSuccess(true); setIsCartOpen(false); setIsConfirmationOpen(false); } } catch (error) { alert('Gagal mengirim pesanan. Silakan coba lagi.'); } finally { setIsSubmitting(false); } };
    const handleReset = () => { setCart([]); setIsSuccess(false); setCustomerDetails(null); onBack(); };

    if (!customerDetails) { return <IdentificationModal onConfirm={handleIdentification} onBack={onBack} />; }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden mx-auto w-full shadow-2xl md:shadow-none">
            <header className="bg-white shadow-sm z-10 flex-shrink-0 sticky top-0">
                <div className="px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3 w-full">
                         <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></button>
                         <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold overflow-hidden border border-orange-200 shrink-0">{storeProfile.logo ? <img src={storeProfile.logo} alt="Logo" className="w-full h-full object-cover"/> : 'UJO'}</div>
                         <div className="leading-tight flex-1"><h1 className="font-bold text-gray-800 truncate">{storeProfile.name}</h1><p className="text-xs text-gray-500 font-semibold">Meja {customerDetails.table}</p></div>
                    </div>
                </div>
                <div className="px-4 pb-3 space-y-3">
                    <div className="relative"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><input type="text" placeholder="Cari menu lezat..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-orange-200 text-sm outline-none font-medium transition-all" /></div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide whitespace-nowrap"><button onClick={() => setActiveCategory('All')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-gray-800 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 border border-gray-200'}`}>Semua</button>{categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-gray-800 text-white shadow-md transform scale-105' : 'bg-white text-gray-600 border border-gray-200'}`}>{cat}</button>)}</div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-3 scroll-smooth pb-28 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">{filteredMenu.map(item => <MenuItemCard key={item.id} item={item} onAdd={handleAddToCart} />)}</div>
                {filteredMenu.length === 0 && <div className="flex flex-col items-center justify-center h-64 text-gray-400"><p>Menu tidak ditemukan</p></div>}
            </main>
            {totalItems > 0 && <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-20 flex justify-between items-center animate-slide-in-up w-full mx-auto"><div onClick={() => setIsCartOpen(true)} className="flex flex-col cursor-pointer"><span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{totalItems} item</span><span className="text-xl font-black text-gray-900">{formatRupiah(breakdown.total)}</span></div><button onClick={() => setIsCartOpen(true)} className="bg-orange-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>Lihat</button></div>}
            <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onUpdateItem={handleUpdateCartItem} onUpdateNote={handleUpdateCartItemNote} onCheckout={handleCheckoutClick} breakdown={breakdown} />
            {isConfirmationOpen && <ConfirmationModal total={breakdown.total} itemCount={totalItems} onConfirm={handleSubmitOrder} onCancel={() => setIsConfirmationOpen(false)} isSubmitting={isSubmitting} />}
            {isSuccess && customerDetails && <SuccessModal onReset={handleReset} cart={cart} customerName={`${customerDetails.name} (Meja ${customerDetails.table})`} total={breakdown.total} />}
        </div>
    );
};

export default CustomerOrderView;
