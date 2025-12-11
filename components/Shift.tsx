import React, { useState } from 'react';
import { useAppContext } from '../types';
import type { Shift, ShiftSummary, Expense } from '../types';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
const formatDateTime = (timestamp: number) => new Date(timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}d`;
}

const StatCard = ({ title, value, className }: { title: string, value: string | number, className?: string }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);

const StartShiftForm = ({ onStart, onLogout }: { onStart: (amount: number) => void, onLogout: () => void }) => {
    const [startCash, setStartCash] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cash = parseFloat(startCash);
        if (!isNaN(cash) && cash >= 0) {
            onStart(cash);
        } else {
            alert('Masukkan jumlah modal awal yang valid.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-100">
            <div className="absolute top-4 right-4">
                <button onClick={onLogout} className="text-gray-500 hover:text-red-600 font-medium text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout Admin
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Buka Shift Baru</h2>
                <p className="text-gray-500 mb-6 text-sm">Masukkan modal awal di laci kasir untuk memulai operasional toko.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                            <input 
                                type="number" 
                                value={startCash} 
                                onChange={(e) => setStartCash(e.target.value)} 
                                className="w-full border border-gray-300 rounded-xl shadow-sm p-4 pl-12 text-2xl font-bold focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" 
                                placeholder="0" 
                                required 
                                autoFocus
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/30">
                        Buka Shift Sekarang
                    </button>
                </form>
            </div>
        </div>
    );
}

const CloseShiftModal = ({ onConfirm, onCancel, expectedCash, startCash, cashRevenue, nonCashRevenue, expenses }: { onConfirm: (closingCash: number) => void, onCancel: () => void, expectedCash: number, startCash: number, cashRevenue: number, nonCashRevenue: number, expenses: number }) => {
    const [closingCash, setClosingCash] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cash = parseFloat(closingCash);
        if(!isNaN(cash)) onConfirm(cash);
    };
    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100">
                <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Konfirmasi Tutup Shift</h2>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm space-y-1">
                    <div className="flex justify-between text-gray-600"><span>Modal Awal:</span><span>{formatRupiah(startCash)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Pendapatan Tunai:</span><span>+ {formatRupiah(cashRevenue)}</span></div>
                     <div className="flex justify-between text-blue-600"><span>Pendapatan Non-Tunai:</span><span>{formatRupiah(nonCashRevenue)}</span></div>
                    <div className="flex justify-between text-red-500"><span>Pengeluaran:</span><span>- {formatRupiah(expenses)}</span></div>
                    <div className="border-t pt-1 flex justify-between font-bold text-gray-800 mt-1"><span>Ekspektasi Uang Fisik:</span><span>{formatRupiah(expectedCash)}</span></div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Masukkan Kas Aktual (Uang di Laci)</label>
                    <input 
                        type="number" 
                        value={closingCash} 
                        onChange={(e) => setClosingCash(e.target.value)} 
                        className="block w-full border-gray-300 rounded-lg shadow-sm p-3 text-lg focus:ring-orange-500 focus:border-orange-500" 
                        placeholder="Rp..." 
                        autoFocus 
                        required 
                    />
                </div>

                <div className="flex space-x-3">
                    <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md">Tutup Shift</button>
                </div>
            </form>
        </div>
    );
};

const ShiftSummaryDisplay = ({ summary }: { summary: ShiftSummary }) => (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Laporan Tutup Shift</h2>
        <div className="space-y-3 text-gray-700 text-sm">
            <div className="flex justify-between"><span >Mulai:</span> <span className="font-semibold">{formatDateTime(summary.start)}</span></div>
            <div className="flex justify-between"><span >Selesai:</span> <span className="font-semibold">{formatDateTime(summary.end || Date.now())}</span></div>
            <div className="bg-gray-50 p-3 rounded my-3 space-y-2">
                <div className="flex justify-between"><span >Modal Awal:</span> <span className="font-semibold">{formatRupiah(summary.start_cash)}</span></div>
                <div className="flex justify-between"><span >+ Tunai Masuk:</span> <span className="font-semibold text-green-600">{formatRupiah(summary.cashRevenue)}</span></div>
                <div className="flex justify-between"><span >+ Non-Tunai (QRIS/Debit):</span> <span className="font-semibold text-blue-600">{formatRupiah(summary.nonCashRevenue)}</span></div>
                <div className="flex justify-between"><span >- Pengeluaran:</span> <span className="font-semibold text-red-600">{formatRupiah(summary.totalExpenses)}</span></div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold"><span>Ekspektasi Kas Fisik:</span> <span>{formatRupiah(summary.expectedCash)}</span></div>
            </div>

            <div className="flex justify-between items-center"><span>Uang di Laci (Aktual):</span> <span className="font-bold text-lg">{formatRupiah(summary.closingCash || 0)}</span></div>
            <div className={`flex justify-between font-bold p-2 rounded-md ${summary.cashDifference === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span >Selisih:</span> 
                <span >{summary.cashDifference && summary.cashDifference > 0 ? '+' : ''}{formatRupiah(summary.cashDifference || 0)}</span>
            </div>
             
            <hr className="my-3"/>
             <div className="flex justify-between"><span >Total Transaksi:</span> <span className="font-semibold">{summary.transactions}</span></div>
            <div className="flex justify-between"><span >Total Omzet (Tunai + Non-Tunai):</span> <span className="font-semibold">{formatRupiah(summary.revenue)}</span></div>
        </div>
        <button onClick={() => window.print()} className="mt-6 w-full bg-gray-800 text-white font-bold py-2 rounded flex justify-center items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Cetak Laporan
        </button>
    </div>
);

const ExpenseManagement = () => {
    const { expenses, addExpense, deleteExpense, activeShift, requestPassword } = useAppContext();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    
    if (!activeShift) return null; 
    
    const shiftExpenses = expenses.filter(e => e.shiftId === activeShift.id);
    const totalExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if(description && !isNaN(numAmount) && numAmount > 0) {
            addExpense(description, numAmount);
            setDescription('');
            setAmount('');
        } else {
            alert('Masukkan deskripsi dan jumlah biaya yang valid.');
        }
    }

    const handleDelete = (id: number) => {
        requestPassword('Yakin hapus biaya ini?', () => deleteExpense(id));
    }

    return (
         <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Biaya Operasional (Shift Ini)</h2>
             <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-4">
                 <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi Biaya (cth: Beli Gas)" className="flex-1 p-2 border rounded-md" required />
                 <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah (Rp)" className="w-40 p-2 border rounded-md" required />
                 <button type="submit" className="bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">+ Catat Biaya</button>
             </form>

             <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {shiftExpenses.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-500">Belum ada biaya tercatat.</td></tr>}
                        {shiftExpenses.map(expense => (
                            <tr key={expense.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRupiah(expense.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase">Total Biaya</td>
                            <td className="px-6 py-3 text-left text-sm font-bold text-gray-700">{formatRupiah(totalExpenses)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
         </div>
    );
}

const ShiftView: React.FC = () => {
    const { activeShift, expenses, closeShift, deleteAndResetShift, requestPassword, startShift, logout } = useAppContext();
    const [isCloseModalOpen, setCloseModalOpen] = useState(false);
    const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'expenses'>('summary');

    const handleConfirmCloseShift = (closingCash: number) => {
        requestPassword('Konfirmasi Tutup Shift', () => {
            const summary = closeShift(closingCash);
            if (summary) {
                setShiftSummary(summary);
                setCloseModalOpen(false);
            }
        });
    };

    const handleDelete = () => {
        requestPassword('Hapus Shift Ini? Data akan hilang permanen.', deleteAndResetShift);
    }

    // If shift summary exists (just closed), show it
    if (shiftSummary) {
        return (
             <div className="p-6 bg-gray-50 h-full flex items-center justify-center">
                <ShiftSummaryDisplay summary={shiftSummary} />
             </div>
        )
    }

    // If no active shift, show the Start Shift Form
    if (!activeShift) {
        return <StartShiftForm onStart={startShift} onLogout={logout} />;
    }

    const currentExpenses = expenses.filter(e => e.shiftId === activeShift.id);
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Calc expected cash live for display
    const expectedCash = activeShift.start_cash + activeShift.cashRevenue - totalExpenses;
    
    const TabButton = ({ tab, label }: { tab: 'summary' | 'expenses', label: string }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-orange-500 text-white' : 'hover:bg-orange-100 text-gray-600'}`}>
            {label}
        </button>
    );

    return (
        <>
            {isCloseModalOpen && <CloseShiftModal onConfirm={handleConfirmCloseShift} onCancel={() => setCloseModalOpen(false)} expectedCash={expectedCash} startCash={activeShift.start_cash} cashRevenue={activeShift.cashRevenue} nonCashRevenue={activeShift.nonCashRevenue} expenses={totalExpenses} />}
            <div className="flex flex-col h-full bg-gray-50">
                <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Shift</h1>
                    <div className="flex items-center space-x-4">
                        {/* Disguised Delete Button */}
                        <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors">
                            Hapus Shift
                        </button>
                        <button onClick={() => setCloseModalOpen(true)} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                            Tutup Shift
                        </button>
                    </div>
                </header>
                
                 <div className="p-4 border-b bg-white">
                    <div className="flex space-x-2">
                        <TabButton tab="summary" label="Ringkasan Shift" />
                        <TabButton tab="expenses" label="Catat Biaya" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'summary' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <StatCard title="Omzet Kotor" value={formatRupiah(activeShift.revenue)} className="bg-orange-50 border border-orange-200" />
                                <StatCard title="Total Biaya" value={formatRupiah(totalExpenses)} className="bg-red-50 border border-red-200" />
                                <StatCard title="Ekspektasi Kas di Laci" value={formatRupiah(expectedCash)} className="bg-green-50 border border-green-200" />
                                
                                <StatCard title="Jumlah Transaksi" value={activeShift.transactions} />
                                <StatCard title="Omzet Tunai" value={formatRupiah(activeShift.cashRevenue)} />
                                <StatCard title="Omzet Non-Tunai" value={formatRupiah(activeShift.nonCashRevenue)} />
                            
                                <div className="bg-white p-6 rounded-lg shadow-sm col-span-full">
                                    <h3 className="text-sm font-medium text-gray-500">Waktu Mulai Shift</h3>
                                    <p className="mt-1 text-xl font-semibold text-gray-900">{formatDateTime(activeShift.start)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'expenses' && <ExpenseManagement />}
                </div>
            </div>
        </>
    );
};

export default ShiftView;