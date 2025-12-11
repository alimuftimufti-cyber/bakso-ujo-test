import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../types'; 
import type { MenuItem, CartItem, Category, Order, OrderType, PaymentMethod } from '../types';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const SplitBillModal = ({ order, onClose, onSplit }: { order: Order, onClose: () => void, onSplit: (items: CartItem[]) => void }) => {
    const [splitItems, setSplitItems] = useState<{ [key: string]: number }>({});
    const getKey = (item: CartItem) => item.id.toString();
    const updateQty = (item: CartItem, change: number) => { const key = getKey(item); const current = splitItems[key] || 0; const next = Math.max(0, Math.min(item.quantity, current + change)); setSplitItems(prev => ({ ...prev, [key]: next })); };
    const handleConfirm = () => { const itemsToMove: CartItem[] = []; order.items.forEach(item => { const qty = splitItems[getKey(item)] || 0; if (qty > 0) itemsToMove.push({ ...item, quantity: qty }); }); onSplit(itemsToMove); };
    return (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh]"><div className="p-4 border-b bg-gray-50 rounded-t-lg"><h3 className="font-bold text-lg text-gray-800">Pisah Pesanan (Split Bill)</h3><p className="text-xs text-gray-500">Tentukan jumlah item yang ingin dipindahkan ke pesanan baru.</p></div><div className="flex-1 overflow-y-auto p-4 space-y-2">{order.items.map((item, idx) => { const key = getKey(item); const selectedQty = splitItems[key] || 0; return (<div key={idx} className={`flex items-center justify-between p-3 border rounded-lg ${selectedQty > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white'}`}><div className="flex-1"><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500">Sisa: {item.quantity - selectedQty}</div></div><div className="flex items-center bg-white border rounded"><button onClick={() => updateQty(item, -1)} className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold">-</button><span className="px-3 text-sm font-bold w-8 text-center">{selectedQty}</span><button onClick={() => updateQty(item, 1)} className="px-3 py-1 hover:bg-gray-100 text-gray-600 font-bold">+</button></div></div>); })}</div><div className="p-4 border-t flex gap-2"><button onClick={onClose} className="flex-1 py-2 bg-gray-200 rounded-lg font-semibold text-gray-700">Batal</button><button onClick={handleConfirm} disabled={Object.values(splitItems).every(q => q === 0)} className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-semibold disabled:bg-gray-300">Pisahkan</button></div></div></div>);
};

const PaymentModal = ({ total, onClose, onPay }: { total: number, onClose: () => void, onPay: (method: PaymentMethod) => void }) => {
    return (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"><div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-in"><h3 className="text-xl font-bold mb-2 text-center">Pilih Metode Bayar</h3><p className="text-center text-2xl font-bold text-orange-600 mb-6">{formatRupiah(total)}</p><div className="grid grid-cols-1 gap-3"><button onClick={() => onPay('Tunai')} className="flex items-center justify-center p-4 border-2 border-gray-100 hover:border-orange-500 rounded-lg font-bold text-lg hover:bg-orange-50 transition-all">💵 Tunai</button><button onClick={() => onPay('QRIS')} className="flex items-center justify-center p-4 border-2 border-gray-100 hover:border-orange-500 rounded-lg font-bold text-lg hover:bg-orange-50 transition-all">📷 QRIS</button><button onClick={() => onPay('Debit')} className="flex items-center justify-center p-4 border-2 border-gray-100 hover:border-orange-500 rounded-lg font-bold text-lg hover:bg-orange-50 transition-all">💳 Debit / EDC</button></div><button onClick={onClose} className="w-full mt-6 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg">Batal</button></div></div>)
}

const CustomerNameModal = ({ onConfirm, onCancel }: { onConfirm: (name: string) => void, onCancel: () => void }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if(name.trim()) onConfirm(name); }
    return (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4"><form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm"><h3 className="text-lg font-bold mb-4 text-gray-800">Nama Pelanggan / Meja</h3><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Meja 5 / Budi" className="w-full p-3 border rounded mb-4" autoFocus required /><div className="space-y-2"><button type="submit" disabled={!name} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-300">Konfirmasi</button><button type="button" onClick={onCancel} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg mt-2 hover:bg-gray-300">Batal</button></div></form></div>);
};

const POSView: React.FC = () => {
    const { menu, categories, orders, addOrder, updateOrder, updateOrderStatus, payForOrder, splitOrder, printerDevice, connectToPrinter, storeProfile, printOrderViaBrowser } = useAppContext();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [discountVal, setDiscountVal] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [orderType, setOrderType] = useState<OrderType>('Dine In');
    const [isNameModalOpen, setNameModalOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingAction, setPendingAction] = useState<'save' | 'pay' | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'active' | 'history'>('active');
    
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

    const isReadOnly = useMemo(() => {
        return activeOrder?.isPaid || activeOrder?.status === 'completed' || activeOrder?.status === 'cancelled';
    }, [activeOrder]);

    const totals = useMemo(() => {
        const itemsToCalculate = cart; 
        const subtotal = itemsToCalculate.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discount = discountType === 'percent' ? (subtotal * discountVal / 100) : discountVal;
        discount = Math.min(discount, subtotal);
        const taxable = subtotal - discount;
        
        // CONDITIONAL LOGIC ADDED HERE
        const service = storeProfile.enableServiceCharge ? taxable * (storeProfile.serviceChargeRate / 100) : 0;
        const tax = storeProfile.enableTax ? (taxable + service) * (storeProfile.taxRate / 100) : 0;
        
        return { subtotal, discount, service, tax, total: Math.round(taxable + service + tax) };
    }, [cart, discountVal, discountType, storeProfile]);

    useEffect(() => {
        if (activeOrder) {
            setCart(activeOrder.items);
            setDiscountVal(activeOrder.discountValue || 0);
            setDiscountType(activeOrder.discountType || 'percent');
            setOrderType(activeOrder.orderType);
        } else {
            setCart([]);
            setDiscountVal(0);
            setOrderType('Dine In');
        }
    }, [activeOrder]);

    const filteredMenu = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return menu.filter(item => (selectedCategory === 'All' || item.category === selectedCategory) && item.name.toLowerCase().includes(lower));
    }, [menu, selectedCategory, searchTerm]);

    const pendingOrders = useMemo(() => orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').sort((a, b) => a.createdAt - b.createdAt), [orders]);
    const historyOrders = useMemo(() => orders.filter(o => o.status === 'completed' || o.status === 'cancelled').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)).slice(0, 20), [orders]);
    const displayedOrders = sidebarTab === 'active' ? pendingOrders : historyOrders;

    const addToCart = (item: MenuItem) => { if (isReadOnly) return; setCart(prev => { const existing = prev.find(i => i.id === item.id); return existing ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...item, quantity: 1, note: item.defaultNote || '' }]; }); };
    const updateCart = (id: number, qty: number, note?: string) => { if (isReadOnly) return; setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty, note: note !== undefined ? note : i.note } : i).filter(i => i.quantity > 0)); };

    const handleAction = (action: 'save' | 'pay') => { if (cart.length === 0) return; if (activeOrder) { updateOrder(activeOrder.id, cart, discountVal, discountType, orderType); if (action === 'pay') { setIsPaymentModalOpen(true); } else { setActiveOrder(null); setCart([]); } } else { setPendingAction(action); setNameModalOpen(true); } };
    const handleNameConfirm = (name: string) => { let newOrder: Order | null = null; if (pendingAction === 'save') { addOrder(cart, name, discountVal, discountType, orderType); setActiveOrder(null); setCart([]); setDiscountVal(0); setOrderType('Dine In'); } else if (pendingAction === 'pay') { newOrder = addOrder(cart, name, discountVal, discountType, orderType); if(newOrder) { setActiveOrder(newOrder); setIsPaymentModalOpen(true); } } setPendingAction(null); setNameModalOpen(false); };
    const handlePayment = (method: PaymentMethod) => { if (activeOrder) { const finalOrder = { ...activeOrder, items: cart, total: totals.total, discount: totals.discount, taxAmount: totals.tax, serviceChargeAmount: totals.service }; const paidOrder = payForOrder(finalOrder, method); if(paidOrder) { setActiveOrder(paidOrder); } setIsPaymentModalOpen(false); } };
    const handleCompleteOrder = (order: Order) => { updateOrderStatus(order.id, 'completed'); setActiveOrder(null); setCart([]); };
    const handleSelectOrder = (o: Order) => { if(activeOrder?.id === o.id) { setActiveOrder(null); } else { setActiveOrder(o); } if (window.innerWidth < 1024) setIsLeftSidebarOpen(false); }

    return (
        <div className="flex h-full w-full bg-gray-50 relative overflow-hidden">
            {isNameModalOpen && <CustomerNameModal onConfirm={handleNameConfirm} onCancel={() => setNameModalOpen(false)} />}
            {isSplitOpen && activeOrder && <SplitBillModal order={activeOrder} onClose={() => setIsSplitOpen(false)} onSplit={(items) => { splitOrder(activeOrder, items); setIsSplitOpen(false); setActiveOrder(null); }} />}
            {isPaymentModalOpen && <PaymentModal total={totals.total} onClose={() => setIsPaymentModalOpen(false)} onPay={handlePayment} />}
            {isLeftSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsLeftSidebarOpen(false)}></div>}

            <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white border-r flex flex-col shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-sm lg:z-10 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex border-b"><button onClick={() => { setSidebarTab('active'); setActiveOrder(null); }} className={`flex-1 py-3 font-semibold text-sm ${sidebarTab === 'active' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>Aktif ({pendingOrders.length})</button><button onClick={() => { setSidebarTab('history'); setActiveOrder(null); }} className={`flex-1 py-3 font-semibold text-sm ${sidebarTab === 'history' ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>Riwayat</button></div>
                <div className="p-2 border-b flex justify-between items-center bg-gray-50"><span className="text-xs font-bold text-gray-500 uppercase">Daftar Pesanan</span><button onClick={() => { setActiveOrder(null); if (window.innerWidth < 1024) setIsLeftSidebarOpen(false); }} className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-bold hover:bg-orange-600 shadow-sm">+ Baru</button></div>
                <div className="flex-1 overflow-y-auto">
                    {displayedOrders.length === 0 && <div className="p-4 text-center text-gray-400 text-sm mt-10">{sidebarTab === 'active' ? 'Tidak ada pesanan aktif' : 'Belum ada riwayat pesanan'}</div>}
                    {displayedOrders.map(o => (<div key={o.id} onClick={() => handleSelectOrder(o)} className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${activeOrder?.id === o.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}><div className="flex justify-between font-medium text-gray-800"><span>#{o.sequentialId} {o.customerName}</span></div><div className="flex justify-between mt-1 text-sm"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{o.isPaid ? 'LUNAS' : 'Belum Bayar'}</span><span className="font-bold text-gray-700">{formatRupiah(o.total)}</span></div>{o.status === 'completed' && <div className="text-xs text-right text-gray-400 mt-1">Selesai</div>}</div>))}
                </div>
                <div className="p-3 border-t text-xs text-center text-gray-500 bg-gray-50">{printerDevice ? <span className="text-green-600 font-semibold flex items-center justify-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg> {printerDevice.productName}</span> : <button onClick={() => connectToPrinter('bluetooth')} className="underline text-blue-600 hover:text-blue-800">Hubungkan Printer</button>}</div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden w-full">
                <div className="p-3 bg-white border-b flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-sm z-10 items-center">
                     <button onClick={() => setIsLeftSidebarOpen(true)} className="lg:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-md border"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                     <button onClick={() => setSelectedCategory('All')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === 'All' ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>All</button>
                     {categories.map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === c ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>{c}</button>)}
                </div>
                <div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{filteredMenu.map(item => (<div key={item.id} onClick={() => addToCart(item)} className="bg-white rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all flex flex-col overflow-hidden active:scale-95"><div className="h-32 bg-gray-200 relative">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg></div>}{item.stock !== undefined && <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{item.stock}</span>}</div><div className="p-3 flex flex-col flex-1"><h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{item.name}</h3><p className="text-orange-600 font-bold mt-auto">{formatRupiah(item.price)}</p></div></div>))}</div></div>
            </main>

            <aside className="w-64 bg-white border-l flex flex-col shadow-xl z-20 flex-shrink-0 hidden md:flex">
                <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-lg text-gray-800 flex justify-between items-center"><span>{activeOrder ? `Order #${activeOrder.sequentialId}` : 'Order #Baru'}</span>{isReadOnly && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">LUNAS</span>}</h2><div className="flex gap-2 mt-2"><button onClick={() => !isReadOnly && setOrderType('Dine In')} disabled={isReadOnly} className={`flex-1 py-1 text-xs font-bold rounded border ${orderType === 'Dine In' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Dine In</button><button onClick={() => !isReadOnly && setOrderType('Take Away')} disabled={isReadOnly} className={`flex-1 py-1 text-xs font-bold rounded border ${orderType === 'Take Away' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Take Away</button></div></div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">{cart.length === 0 ? (<div className="text-center text-gray-400 mt-10">Keranjang Kosong</div>) : (cart.map(item => (<div key={item.id} className="flex flex-col border-b pb-2"><div className="flex justify-between items-start"><div className="flex-1 mr-2"><div className="font-medium text-sm leading-tight">{item.name}</div>{item.note && <div className="text-xs text-gray-500 italic mt-0.5">"{item.note}"</div>}</div><div className="font-bold text-sm">{formatRupiah(item.price * item.quantity)}</div></div>{!isReadOnly && (<div className="flex items-center justify-between mt-2"><input placeholder="Catatan..." value={item.note || ''} onChange={e => updateCart(item.id, item.quantity, e.target.value)} className="text-xs border-b border-gray-300 focus:border-orange-500 outline-none w-20 bg-transparent" /><div className="flex items-center bg-gray-100 rounded"><button onClick={() => updateCart(item.id, item.quantity - 1)} className="px-2 py-0.5 font-bold hover:bg-gray-200 text-gray-600">-</button><span className="px-2 text-xs font-bold">{item.quantity}</span><button onClick={() => updateCart(item.id, item.quantity + 1)} className="px-2 py-0.5 font-bold hover:bg-gray-200 text-gray-600">+</button></div></div>)}{isReadOnly && <div className="text-xs text-gray-500 text-right mt-1">{item.quantity}x</div>}</div>)))}</div>
                
                <div className="p-3 bg-gray-50 border-t space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span> <span>{formatRupiah(totals.subtotal)}</span></div>
                    {!isReadOnly && (<div className="flex justify-between items-center"><span className="text-gray-600">Diskon</span><div className="flex items-center gap-1"><button onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')} className="text-xs font-bold bg-gray-200 px-1 rounded">{discountType === 'percent' ? '%' : 'Rp'}</button><input type="number" value={discountVal} onChange={e => setDiscountVal(parseFloat(e.target.value) || 0)} className="w-16 text-right border rounded p-0.5 text-xs" /></div></div>)}
                    {isReadOnly && totals.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span> <span>-{formatRupiah(totals.discount)}</span></div>}

                    {/* Conditional Display of Tax and Service */}
                    {totals.tax > 0 && <div className="flex justify-between text-gray-500"><span>Pajak ({storeProfile.taxRate}%)</span> <span>{formatRupiah(totals.tax)}</span></div>}
                    {totals.service > 0 && <div className="flex justify-between text-gray-500"><span>Service ({storeProfile.serviceChargeRate}%)</span> <span>{formatRupiah(totals.service)}</span></div>}
                    
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-1"><span>Total</span><span>{formatRupiah(totals.total)}</span></div>

                    {!isReadOnly ? (<div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => handleAction('save')} className="bg-orange-500 text-white py-2.5 rounded font-bold hover:bg-orange-600 text-sm">Simpan</button><button onClick={() => handleAction('pay')} className="bg-green-600 text-white py-2.5 rounded font-bold hover:bg-green-700 text-sm">Bayar</button>{activeOrder && <button onClick={() => setIsSplitOpen(true)} className="col-span-2 bg-gray-200 text-gray-700 py-2 rounded font-bold hover:bg-gray-300 text-xs">Split Bill</button>}</div>) : (<div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => printOrderViaBrowser({ ...activeOrder!, items: cart }, 'receipt')} className="bg-gray-600 text-white py-2.5 rounded font-bold hover:bg-gray-700 text-sm">Cetak Ulang</button><button onClick={() => handleCompleteOrder(activeOrder!)} className="bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 text-sm">Selesai</button></div>)}
                </div>
            </aside>
        </div>
    );
};

export default POSView;