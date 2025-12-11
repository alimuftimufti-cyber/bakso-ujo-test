import React, { useState, useMemo } from 'react';
import { useAppContext } from '../types';
import type { Order, Category, CartItem } from '../types';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

type SortKey = 'name' | 'quantity' | 'revenue';
type SortDirection = 'asc' | 'desc';

const StatCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
);

const chartColors = [
    'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 
    'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 
    'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400',
    'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400'
];

const SalesChart = ({ orders }: { orders: Order[] }) => {
    const dataByDay = useMemo(() => {
        const sales: { [key: string]: number } = {};
        orders.forEach(order => {
            if (!order.completedAt) return;
            const date = new Date(order.completedAt).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit' });
            if (!sales[date]) sales[date] = 0;
            sales[date] += order.total;
        });
        return Object.entries(sales).map(([label, value]) => ({ label, value })).reverse();
    }, [orders]);

    if (dataByDay.length === 0) {
       return (<div className="bg-white p-6 rounded-lg shadow-sm col-span-1 md:col-span-2 flex items-center justify-center h-80">
            <p className="text-gray-500">Tidak ada data omzet untuk ditampilkan.</p>
        </div>)
    }

    const maxValue = Math.max(...dataByDay.map(d => d.value), 1);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Omzet Harian</h3>
            <div className="flex justify-around items-end h-64 space-x-2 pt-4 border-t">
                {dataByDay.map(({ label, value }, index) => {
                    const colorClass = chartColors[index % chartColors.length];
                    const heightPercent = (value / maxValue) * 90;
                    
                    return (
                        <div key={label} className="flex flex-col items-center flex-1 h-full justify-end" title={`${label}: ${formatRupiah(value)}`}>
                            <div className="text-xs text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{formatRupiah(value)}</div>
                            <div className={`w-full rounded-t-md hover:opacity-80 transition-opacity group ${colorClass}`} style={{ height: `${heightPercent}%` }}></div>
                            <div className="text-sm font-medium text-gray-600 mt-2 border-t w-full text-center pt-1">{label}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TopProducts = ({ orders }: { orders: Order[] }) => {
    const [sortKey, setSortKey] = useState<SortKey>('quantity');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sortedTopProducts = useMemo(() => {
        const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.id]) {
                    productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productSales[item.id].quantity += item.quantity;
                productSales[item.id].revenue += item.price * item.quantity;
            });
        });

        const sorted = Object.values(productSales).sort((a, b) => {
            if (a[sortKey] < b[sortKey]) return sortDirection === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted.slice(0, 10);
    }, [orders, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => {
        const isSorted = sortKey === tkey;
        return (
             <th onClick={() => handleSort(tkey)} className="text-right text-sm font-medium text-gray-500 py-2 cursor-pointer hover:text-gray-800">
                {label} {isSorted ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
            </th>
        );
    }


    if (sortedTopProducts.length === 0) return <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-full"><p className="text-gray-500">Tidak ada data produk terjual.</p></div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Produk Terlaris</h3>
            <table className="min-w-full">
                <thead className="border-b">
                    <tr>
                        <th onClick={() => handleSort('name')} className="text-left text-sm font-medium text-gray-500 py-2 cursor-pointer hover:text-gray-800">
                           Produk {sortKey === 'name' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                        </th>
                        <SortableHeader tkey="quantity" label="Terjual" />
                        <SortableHeader tkey="revenue" label="Omzet" />
                    </tr>
                </thead>
                <tbody>
                    {sortedTopProducts.map(p => (
                        <tr key={p.name} className="border-b last:border-0">
                            <td className="py-2 font-medium text-gray-800">{p.name}</td>
                            <td className="py-2 text-right text-gray-600">{p.quantity}</td>
                            <td className="py-2 text-right text-gray-600">{formatRupiah(p.revenue)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const CategorySales = ({ orders, categories }: { orders: Order[], categories: Category[] }) => {
    const categorySales = useMemo(() => {
        const sales: { [key: string]: number } = {};
        
        // Initialize all current categories to 0
        categories.forEach(cat => sales[cat] = 0);

        orders.forEach(order => {
            order.items.forEach(item => {
                // Even if category was deleted, it might show up from old orders. 
                if (sales[item.category] === undefined) sales[item.category] = 0;
                sales[item.category] += item.quantity * item.price;
            });
        });
        return Object.entries(sales).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [orders, categories]);
    
    const total = categorySales.reduce((sum, cat) => sum + cat.value, 0);
    if(total === 0) return <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center h-full"><p className="text-gray-500">Tidak ada data penjualan per kategori.</p></div>;

    const colors = [
        '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399', '#22D3EE', '#818CF8', '#C084FC', '#F472B6',
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">Omzet per Kategori</h3>
             <div className="flex items-center justify-center space-x-8">
                 <div className="w-32 h-32 rounded-full flex items-center justify-center" style={{ background: `conic-gradient(${categorySales.map((c, i) => `${colors[i % colors.length]} 0 ${(c.value / total) * 100}%`).join(', ')})` }}>
                    <div className="w-20 h-20 bg-white rounded-full"></div>
                </div>
                 <div className="space-y-2">
                    {categorySales.filter(c => c.value > 0).map((c, i) => (
                        <div key={c.name} className="flex items-center">
                            <span className="w-4 h-4 rounded-full mr-2" style={{backgroundColor: colors[i % colors.length]}}></span>
                            <div>
                               <div className="font-semibold text-gray-700">{c.name}</div>
                               <div className="text-sm text-gray-500">{formatRupiah(c.value)}</div>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        </div>
    )
}


const ReportView: React.FC = () => {
    const { orders, categories } = useAppContext();
    const [endDate, setEndDate] = useState(new Date());
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 6);
        return date;
    });

    const setDateRange = (type: 'week' | 'month') => {
        const end = new Date();
        const start = new Date();
        if (type === 'week') start.setDate(start.getDate() - 6);
        else if (type === 'month') start.setMonth(start.getMonth() - 1);
        setStartDate(start);
        setEndDate(end);
    };

    const completedOrdersInDateRange = useMemo(() => {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const startTimestamp = startOfDay.getTime();

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        const endTimestamp = endOfDay.getTime();
        
        return orders.filter(o => 
            o.status === 'completed' && 
            o.completedAt && 
            o.completedAt >= startTimestamp && 
            o.completedAt <= endTimestamp
        );
    }, [orders, startDate, endDate]);

    const reportData = useMemo(() => {
        return completedOrdersInDateRange.reduce((acc, order) => {
            acc.revenue += order.total;
            acc.transactions += 1;
            acc.totalDiscount += order.discount;
            if (order.paymentMethod === 'Tunai') acc.cashRevenue += order.total;
            else acc.nonCashRevenue += order.total;
            return acc;
        }, { revenue: 0, transactions: 0, cashRevenue: 0, nonCashRevenue: 0, totalDiscount: 0 });
    }, [completedOrdersInDateRange]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="p-4 bg-white border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
                    <div className="flex items-center space-x-2">
                         <input type="date" value={startDate.toISOString().split('T')[0]} onChange={e => setStartDate(new Date(e.target.value))} className="p-2 border rounded-md text-sm"/>
                         <span className="text-gray-500">-</span>
                         <input type="date" value={endDate.toISOString().split('T')[0]} onChange={e => setEndDate(new Date(e.target.value))} className="p-2 border rounded-md text-sm"/>
                        <button onClick={() => setDateRange('week')} className="px-3 py-2 bg-gray-200 rounded-md text-sm font-semibold hover:bg-gray-300">7 Hari</button>
                        <button onClick={() => setDateRange('month')} className="px-3 py-2 bg-gray-200 rounded-md text-sm font-semibold hover:bg-gray-300">30 Hari</button>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard title="Total Omzet" value={formatRupiah(reportData.revenue)} />
                    <StatCard title="Total Transaksi" value={reportData.transactions} />
                    <StatCard title="Total Diskon" value={formatRupiah(reportData.totalDiscount)} />
                     <StatCard title="Rata-rata/Transaksi" value={reportData.transactions > 0 ? formatRupiah(reportData.revenue / reportData.transactions) : formatRupiah(0)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SalesChart orders={completedOrdersInDateRange} />
                    <CategorySales orders={completedOrdersInDateRange} categories={categories} />
                    <TopProducts orders={completedOrdersInDateRange} />
                </div>
            </div>
        </div>
    );
};

export default ReportView;