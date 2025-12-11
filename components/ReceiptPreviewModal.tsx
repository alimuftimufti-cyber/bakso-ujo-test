import React from 'react';
import { useAppContext } from '../types';
import PrintableReceipt from './PrintableReceipt';
import type { Order } from '../types';

const ReceiptPreviewModal = ({ order, onClose, variant = 'receipt' }: { order: Order, onClose: () => void, variant?: 'receipt' | 'kitchen' }) => {
    const { storeProfile, printOrderToDevice, printOrderViaBrowser, isPrinting, printerDevice } = useAppContext();

    const handlePrintDirect = () => {
        printOrderToDevice(order);
    };

    const handlePrintBrowser = () => {
        printOrderViaBrowser(order, variant);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99] p-4 no-print">
            <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-[340px] flex flex-col h-[95vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">Pratinjau {variant === 'kitchen' ? 'Tiket Dapur' : 'Struk'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-light">&times;</button>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-white p-2">
                     <div id="receipt-content-for-browser">
                        <PrintableReceipt order={order} profile={storeProfile} variant={variant} />
                     </div>
                </div>
                
                <div className="p-4 border-t bg-white space-y-2">
                    {variant === 'receipt' && (
                        <button 
                            onClick={handlePrintDirect}
                            disabled={!printerDevice || isPrinting}
                            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isPrinting ? 'Mencetak...' : (printerDevice ? 'Cetak ke Printer Struk' : 'Pilih Printer Dulu')}
                        </button>
                    )}
                    <button 
                        onClick={handlePrintBrowser}
                        className="w-full bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-700"
                    >
                        Cetak via Browser (Kompatibel)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptPreviewModal;