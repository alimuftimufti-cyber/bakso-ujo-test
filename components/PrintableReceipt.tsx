import React from 'react';
import type { Order, StoreProfile, CartItem } from '../types';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
const formatDateTime = (timestamp: number) => new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

interface PrintableReceiptProps {
    order: Order;
    profile: StoreProfile;
    variant?: 'receipt' | 'kitchen';
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ order, profile, variant = 'receipt' }) => {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isKitchen = variant === 'kitchen';

  // Separation logic
  const drinkItems = order.items.filter(item => item.category === 'Minuman');
  const foodItems = order.items.filter(item => item.category !== 'Minuman');

  const renderItem = (item: CartItem) => (
      <div key={item.id} className={`my-1 ${isKitchen ? 'mb-3 border-b border-dotted border-gray-300 pb-1' : ''}`}>
        {isKitchen ? (
            // Kitchen View: Large Quantity and Name
            <div className="flex gap-2 font-bold text-lg items-start">
                <span className="w-8 text-right shrink-0">{item.quantity}x</span>
                <span className="leading-tight">{item.name}</span>
            </div>
        ) : (
            // Receipt View: Normal layout with prices
            <>
                <div>{item.name}</div>
                <div className="flex justify-between">
                    <span>{item.quantity} x {formatRupiah(item.price)}</span>
                    <span className="font-bold">{formatRupiah(item.price * item.quantity)}</span>
                </div>
            </>
        )}
        {item.note && <div className={`${isKitchen ? 'text-base font-bold' : 'text-xs italic'} pl-10 text-gray-600`}>Catatan: {item.note}</div>}
      </div>
  );

  return (
    <div id="printable-receipt" className="bg-white text-black p-2" style={{ width: '100%', maxWidth: '300px', margin: '0 auto', fontFamily: 'monospace' }}>
      <div className="text-center">
        {/* Show Logo and Address only on customer receipt */}
        {!isKitchen && (
            <>
                {profile.logo && <img src={profile.logo} alt="logo" className="w-12 h-12 mx-auto mb-2 object-contain" />}
                <h1 className="font-bold text-lg leading-tight">{profile.name}</h1>
                <p className="text-xs mb-2">{profile.address}</p>
            </>
        )}
        
        <p className="text-xs mt-2">{formatDateTime(order.completedAt || order.paidAt || order.createdAt || Date.now())}</p>
        <p className="font-bold text-sm">#{order.sequentialId || order.id.slice(-4)} {isKitchen ? '' : '/ Admin'}</p>
        
        {/* Order Type is crucial for Kitchen */}
        <div className={`font-bold uppercase my-1 ${isKitchen ? 'text-xl border-2 border-black inline-block px-2' : 'text-sm'}`}>
            {order.orderType}
        </div>
        
        {isKitchen && <p className="font-bold text-lg mt-1 truncate">{order.customerName}</p>}
      </div>
      
      <hr className="my-2 border-t-2 border-black border-dashed" />
      
      <div className="text-left">
        {isKitchen ? (
            <>
                {/* SECTION MAKANAN */}
                {foodItems.length > 0 && (
                    <div className="mb-4">
                        <div className="font-black text-base border-b-2 border-black mb-2 pb-1">== MAKANAN ==</div>
                        {foodItems.map(item => renderItem(item))}
                    </div>
                )}

                {/* SECTION MINUMAN */}
                {drinkItems.length > 0 && (
                    <div className="mb-4">
                        <div className="font-black text-base border-b-2 border-black mb-2 pb-1">== MINUMAN ==</div>
                        {drinkItems.map(item => renderItem(item))}
                    </div>
                )}
            </>
        ) : (
            // Regular Receipt (Mixed)
            order.items.map(item => renderItem(item))
        )}
      </div>
      
      <hr className="my-2 border-t-2 border-black border-dashed" />

      {/* Hide Financials for Kitchen Ticket */}
      {!isKitchen && (
          <div className="text-sm">
            <div className="space-y-1">
                <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
                </div>
                {order.discount > 0 && (
                    <div className="flex justify-between">
                    <span>Diskon</span>
                    <span>-{formatRupiah(order.discount)}</span>
                    </div>
                )}
                {order.taxAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Pajak</span>
                        <span>{formatRupiah(order.taxAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-base mt-2">
                <span>TOTAL</span>
                <span>{formatRupiah(order.total)}</span>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-dotted border-gray-400">
                <div className="flex justify-between">
                    <span>Bayar</span>
                    <span className="capitalize font-bold">{order.paymentMethod || '-'}</span>
                </div>
            </div>
            <div className="text-center mt-6 text-xs">
                <p>Terima Kasih!</p>
                <p>Selamat Menikmati</p>
            </div>
          </div>
      )}
      
      {isKitchen && (
          <div className="text-center mt-4 font-bold text-sm">
              *** TIKET DAPUR ***
          </div>
      )}
    </div>
  );
};

export default PrintableReceipt;