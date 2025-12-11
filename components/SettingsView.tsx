import React, { useState } from 'react';
import { useAppContext } from '../types'; 
import type { MenuItem, Ingredient, User } from '../types';

const formatRupiah = (number: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const MenuForm = ({ onClose, onSave, item }: { onClose: () => void, onSave: (i: MenuItem) => void, item: MenuItem | null }) => {
    const { categories, ingredients } = useAppContext();
    const [form, setForm] = useState<any>(item || { name: '', price: '', category: categories[0], imageUrl: '', recipe: [], stock: '' });

    const handleRecipe = (ingId: string, amount: number) => {
        let newRecipe = [...(form.recipe || [])];
        const idx = newRecipe.findIndex((r: any) => r.ingredientId === ingId);
        if (amount <= 0) { if (idx > -1) newRecipe.splice(idx, 1); }
        else { if (idx > -1) newRecipe[idx].amount = amount; else newRecipe.push({ ingredientId: ingId, amount }); }
        setForm({ ...form, recipe: newRecipe });
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = () => setForm({...form, imageUrl: reader.result});
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{item ? 'Edit' : 'Tambah'} Menu</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <input placeholder="Nama Menu" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="number" placeholder="Harga" className="w-full border p-2 rounded" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                            <input type="number" placeholder="Stok (Opsional)" className="w-full border p-2 rounded" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                        </div>
                        <select className="w-full border p-2 rounded" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <div><label className="text-xs">Gambar</label><input type="file" onChange={handleImage} className="w-full text-sm"/></div>
                        {form.imageUrl && <img src={form.imageUrl} className="h-20 w-20 object-cover rounded"/>}
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <h3 className="font-bold text-sm mb-2">Resep (Bahan Baku)</h3>
                        <div className="space-y-1 h-40 overflow-y-auto text-sm">
                            {ingredients.map(ing => {
                                const used = form.recipe?.find((r: any) => r.ingredientId === ing.id);
                                return (
                                    <div key={ing.id} className="flex justify-between items-center">
                                        <span>{ing.name} ({ing.unit})</span>
                                        <input type="number" placeholder="0" className="w-16 p-1 border rounded text-right" value={used?.amount || ''} onChange={e => handleRecipe(ing.id, parseFloat(e.target.value))} />
                                    </div>
                                );
                            })}
                            {ingredients.length === 0 && <p className="text-red-500 text-xs">Belum ada bahan baku.</p>}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">*Kosongkan jika menggunakan Stok Langsung (Mis: Kerupuk).</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button onClick={() => onSave({ ...form, price: parseFloat(form.price), stock: form.stock ? parseFloat(form.stock) : undefined, id: form.id || Date.now() })} className="px-4 py-2 bg-orange-500 text-white rounded">Simpan</button>
                </div>
            </div>
        </div>
    );
};

const SettingsView = () => {
    const { 
        menu, setMenu, ingredients, addIngredient, updateIngredient, deleteIngredient, 
        users, addUser, updateUser, deleteUser, 
        storeProfile, setStoreProfile, requestPassword, 
        categories, addCategory, deleteCategory,
        kitchenAlarmTime, setKitchenAlarmTime, kitchenAlarmSound, setKitchenAlarmSound
    } = useAppContext();

    const [tab, setTab] = useState<'menu' | 'inventory' | 'users' | 'profile'>('menu');
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [isMenuModalOpen, setMenuModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [inventorySubTab, setInventorySubTab] = useState<'raw' | 'product'>('raw');
    const [ingForm, setIngForm] = useState<Ingredient>({ id: '', name: '', unit: 'gram', stock: 0 });
    const [editingIngId, setEditingIngId] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [userForm, setUserForm] = useState<User>({ id: '', name: '', pin: '', role: 'cashier' });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    const saveMenu = (item: MenuItem) => { setMenu(prev => { const idx = prev.findIndex(i => i.id === item.id); if (idx > -1) { const newMenu = [...prev]; newMenu[idx] = item; return newMenu; } return [...prev, item]; }); setMenuModalOpen(false); };
    const deleteMenu = (id: number) => requestPassword("Hapus menu?", () => setMenu(prev => prev.filter(i => i.id !== id)));
    const saveIng = (e: React.FormEvent) => { e.preventDefault(); if (editingIngId) updateIngredient(ingForm); else addIngredient({ ...ingForm, id: Date.now().toString() }); setIngForm({ id: '', name: '', unit: 'gram', stock: 0 }); setEditingIngId(null); };
    const updateProductStock = (id: number, newStock: number) => { setMenu(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m)); };
    const saveUser = (e: React.FormEvent) => { e.preventDefault(); requestPassword("Simpan User?", () => { if (editingUserId) updateUser(userForm); else addUser({ ...userForm, id: Date.now().toString() }); setUserForm({ id: '', name: '', pin: '', role: 'cashier' }); setEditingUserId(null); }, true); };
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = () => setStoreProfile({...storeProfile, logo: reader.result as string}); reader.readAsDataURL(file); } }

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white border-b p-4 flex gap-2 overflow-x-auto">
                {['menu', 'inventory', 'users', 'profile'].map(t => <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 rounded font-bold capitalize ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>)}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {tab === 'menu' && (
                    <>
                        <div className="mb-6 bg-white p-4 rounded shadow">
                            <h3 className="font-bold mb-2">Kategori Menu</h3>
                            <div className="flex gap-2 mb-3">
                                <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nama Kategori Baru" className="border p-2 rounded flex-1"/>
                                <button onClick={() => { if(newCategory) { addCategory(newCategory); setNewCategory(''); }}} className="bg-green-600 text-white px-4 py-2 rounded">Tambah</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(c => <span key={c} className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">{c} <button onClick={() => deleteCategory(c)} className="text-red-500 font-bold">&times;</button></span>)}
                            </div>
                        </div>
                        <button onClick={() => { setEditingMenu(null); setMenuModalOpen(true); }} className="bg-orange-500 text-white px-4 py-2 rounded mb-4 font-bold">+ Menu Baru</button>
                        <div className="bg-white rounded shadow overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 text-left text-sm font-bold text-gray-600"><tr><th className="p-3">Nama</th><th className="p-3">Kategori</th><th className="p-3">Harga</th><th className="p-3 text-right">Aksi</th></tr></thead>
                                <tbody>{menu.map(m => <tr key={m.id} className="border-b"><td className="p-3">{m.name}</td><td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{m.category}</span></td><td className="p-3">{formatRupiah(m.price)}</td><td className="p-3 text-right"><button onClick={() => { setEditingMenu(m); setMenuModalOpen(true); }} className="text-blue-600 mr-2">Edit</button><button onClick={() => deleteMenu(m.id)} className="text-red-600">Hapus</button></td></tr>)}</tbody>
                            </table>
                        </div>
                        {isMenuModalOpen && <MenuForm onClose={() => setMenuModalOpen(false)} onSave={saveMenu} item={editingMenu} />}
                    </>
                )}

                {tab === 'inventory' && (
                    <div>
                        <div className="flex gap-4 mb-4">
                            <button onClick={() => setInventorySubTab('raw')} className={`px-4 py-2 rounded border ${inventorySubTab === 'raw' ? 'bg-gray-800 text-white' : 'bg-white'}`}>Bahan Baku (Resep)</button>
                            <button onClick={() => setInventorySubTab('product')} className={`px-4 py-2 rounded border ${inventorySubTab === 'product' ? 'bg-gray-800 text-white' : 'bg-white'}`}>Stok Produk Jadi</button>
                        </div>

                        {inventorySubTab === 'raw' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-4 rounded shadow h-fit"><h3 className="font-bold mb-3">{editingIngId ? 'Edit' : 'Tambah'} Bahan</h3><form onSubmit={saveIng} className="space-y-3"><input className="w-full border p-2 rounded" placeholder="Nama Bahan" value={ingForm.name} onChange={e => setIngForm({ ...ingForm, name: e.target.value })} required /><div className="flex gap-2"><input type="number" className="w-1/2 border p-2 rounded" placeholder="Stok" value={ingForm.stock} onChange={e => setIngForm({ ...ingForm, stock: parseFloat(e.target.value) })} required /><select className="w-1/2 border p-2 rounded" value={ingForm.unit} onChange={e => setIngForm({ ...ingForm, unit: e.target.value })}>{['gram', 'kg', 'ml', 'liter', 'pcs', 'porsi'].map(u => <option key={u} value={u}>{u}</option>)}</select></div><button className="w-full bg-orange-500 text-white py-2 rounded font-bold">Simpan</button></form></div>
                                <div className="lg:col-span-2 bg-white p-4 rounded shadow"><table className="min-w-full"><thead className="bg-gray-50 text-left text-sm font-bold text-gray-600"><tr><th className="p-3">Bahan</th><th className="p-3">Stok</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{ingredients.map(i => <tr key={i.id} className="border-b"><td className="p-3">{i.name}</td><td className="p-3">{i.stock} {i.unit}</td><td className="p-3 text-right"><button onClick={() => { setIngForm(i); setEditingIngId(i.id); }} className="text-blue-600 mr-2">Edit</button><button onClick={() => deleteIngredient(i.id)} className="text-red-600">Hapus</button></td></tr>)}</tbody></table></div>
                            </div>
                        ) : (
                            <div className="bg-white p-4 rounded shadow">
                                <div className="mb-4">
                                    <input placeholder="Cari Produk..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full p-2 border rounded" />
                                </div>
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 text-left text-sm font-bold text-gray-600"><tr><th className="p-3">Nama Produk</th><th className="p-3">Kategori</th><th className="p-3">Stok Saat Ini</th><th className="p-3">Update Stok</th></tr></thead>
                                    <tbody>
                                        {menu.filter(m => m.name.toLowerCase().includes(productSearch.toLowerCase()) && m.stock !== undefined).map(m => (
                                            <tr key={m.id} className="border-b">
                                                <td className="p-3">{m.name}</td>
                                                <td className="p-3"><span className="bg-gray-100 text-xs px-2 py-1 rounded">{m.category}</span></td>
                                                <td className="p-3 font-bold">
                                                    <input type="number" value={m.stock || 0} onChange={(e) => updateProductStock(m.id, parseFloat(e.target.value) || 0)} className="w-24 border p-1 rounded text-center" />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => updateProductStock(m.id, (m.stock || 0) - 1)} className="bg-red-100 text-red-600 w-8 h-8 rounded hover:bg-red-200 font-bold">-</button>
                                                        <button onClick={() => updateProductStock(m.id, (m.stock || 0) + 1)} className="bg-green-100 text-green-600 w-8 h-8 rounded hover:bg-green-200 font-bold">+</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {menu.filter(m => m.stock !== undefined).length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada produk dengan pengaturan stok langsung.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded shadow h-fit"><h3 className="font-bold mb-3">{editingUserId ? 'Edit' : 'Tambah'} User</h3><form onSubmit={saveUser} className="space-y-3"><input className="w-full border p-2 rounded" placeholder="Nama" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required /><input className="w-full border p-2 rounded" placeholder="PIN (Angka)" value={userForm.pin} onChange={e => setUserForm({ ...userForm, pin: e.target.value })} required /><select className="w-full border p-2 rounded" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}>{['admin', 'cashier', 'kitchen'].map(r => <option key={r} value={r}>{r}</option>)}</select><button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Simpan</button></form></div>
                        <div className="lg:col-span-2 bg-white p-4 rounded shadow"><table className="min-w-full"><thead className="bg-gray-50 text-left text-sm font-bold text-gray-600"><tr><th className="p-3">Nama</th><th className="p-3">Role</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{users.map(u => <tr key={u.id} className="border-b"><td className="p-3">{u.name}</td><td className="p-3 capitalize">{u.role}</td><td className="p-3 text-right"><button onClick={() => { setUserForm(u); setEditingUserId(u.id); }} className="text-blue-600 mr-2">Edit</button>{u.role !== 'admin' && <button onClick={() => deleteUser(u.id)} className="text-red-600">Hapus</button>}</td></tr>)}</tbody></table></div>
                    </div>
                )}

                {tab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded shadow space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">Profil Toko & Pajak</h3>
                            <div><label className="block text-sm font-bold">Nama Toko</label><input className="w-full border p-2 rounded" value={storeProfile.name} onChange={e => setStoreProfile({ ...storeProfile, name: e.target.value })} /></div>
                            <div><label className="block text-sm font-bold">Slogan</label><input className="w-full border p-2 rounded" value={storeProfile.slogan} onChange={e => setStoreProfile({ ...storeProfile, slogan: e.target.value })} /></div>
                            <div><label className="block text-sm font-bold">Alamat</label><input className="w-full border p-2 rounded" value={storeProfile.address} onChange={e => setStoreProfile({ ...storeProfile, address: e.target.value })} /></div>
                            
                            <div>
                                <label className="block text-sm font-bold">Upload Logo (Klik)</label>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm" />
                                {storeProfile.logo && (<div className="mt-2"><p className="text-xs text-gray-500 mb-1">Preview:</p><img src={storeProfile.logo} alt="Logo Preview" className="h-16 w-16 object-cover rounded-full border"/></div>)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold">Pajak (%)</label>
                                        <input type="checkbox" checked={storeProfile.enableTax} onChange={e => setStoreProfile({...storeProfile, enableTax: e.target.checked})} className="h-4 w-4 text-orange-600" title="Aktifkan Pajak" />
                                    </div>
                                    <input type="number" disabled={!storeProfile.enableTax} className="w-full border p-2 rounded disabled:bg-gray-100" value={storeProfile.taxRate} onChange={e => setStoreProfile({ ...storeProfile, taxRate: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold">Service (%)</label>
                                        <input type="checkbox" checked={storeProfile.enableServiceCharge} onChange={e => setStoreProfile({...storeProfile, enableServiceCharge: e.target.checked})} className="h-4 w-4 text-orange-600" title="Aktifkan Service Charge" />
                                    </div>
                                    <input type="number" disabled={!storeProfile.enableServiceCharge} className="w-full border p-2 rounded disabled:bg-gray-100" value={storeProfile.serviceChargeRate} onChange={e => setStoreProfile({ ...storeProfile, serviceChargeRate: parseFloat(e.target.value) || 0 })} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded shadow space-y-4"><h3 className="font-bold text-lg border-b pb-2">Pengaturan Printer</h3><div className="flex items-center gap-4"><div className="flex-1"><label className="block text-sm font-bold mb-1">Otomatis Cetak Struk</label><p className="text-xs text-gray-500">Langsung cetak saat bayar tanpa preview.</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={storeProfile.autoPrintReceipt} onChange={e => setStoreProfile({ ...storeProfile, autoPrintReceipt: e.target.checked })} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div></label></div></div>
                            <div className="bg-white p-6 rounded shadow space-y-4"><h3 className="font-bold text-lg border-b pb-2">Pengaturan Alarm Dapur</h3><div><label className="block text-sm font-bold">Waktu Tunggu Maksimal (Detik)</label><input type="number" className="w-full border p-2 rounded" value={kitchenAlarmTime} onChange={e => setKitchenAlarmTime(parseInt(e.target.value) || 600)} /><p className="text-xs text-gray-500 mt-1">Alarm berbunyi jika pesanan belum siap setelah waktu ini.</p></div><div><label className="block text-sm font-bold">Suara Alarm</label><select className="w-full border p-2 rounded" value={kitchenAlarmSound} onChange={e => setKitchenAlarmSound(e.target.value)}><option value="none">Mati</option><option value="beep">Beep</option><option value="ring">Ring</option><option value="bell">Bell</option></select></div></div>
                        </div>

                         <button onClick={() => requestPassword("Simpan Profil?", () => alert("Disimpan"), true)} className="w-full bg-green-600 text-white py-3 rounded font-bold mt-4 md:col-span-2">Simpan Perubahan</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsView;