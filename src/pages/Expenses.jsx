import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Plus, Edit2, Trash2, FileSpreadsheet, FileText as FilePdf, Eye } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

import { FILE_BASE_URL } from '../config';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'Office', date: new Date().toISOString().split('T')[0], note: '', receipt: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const categories = ['Office', 'Transportation', 'Entertainment', 'Others'];

    const { showLoading, hideLoading } = useLoading();

    const fetchExpenses = async () => {
        try { setLoading(true); const { data } = await api.get('/expenses'); setExpenses(data); }
        catch { toast.error('খরচের তথ্য লোড করতে সমস্যা হয়েছে'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'receipt') data.append(key, formData[key]);
            });
            if (receiptFile) data.append('receipt', receiptFile);

            if (editId) {
                await api.put(`/expenses/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('খরচ আপডেট করা হয়েছে');
            }
            else {
                await api.post('/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('নতুন খরচ সফলভাবে যোগ করা হয়েছে');
            }
            setIsModalOpen(false); setEditId(null);
            setFormData({ title: '', amount: '', category: 'Office', date: new Date().toISOString().split('T')[0], note: '', receipt: '' });
            setReceiptFile(null); setReceiptPreview(null);
            fetchExpenses();
        } catch (error) { toast.error(error.response?.data?.message || 'খরচ সংরক্ষণ করতে সমস্যা হয়েছে'); }
        finally { hideLoading(); }
    };

    const handleEdit = (expense) => {
        setEditId(expense._id);
        setFormData({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: new Date(expense.date).toISOString().split('T')[0],
            note: expense.note || '',
            receipt: expense.receipt || ''
        });
        setReceiptPreview(expense.receipt ? `${FILE_BASE_URL}${expense.receipt}` : null);
        setReceiptFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            showLoading();
            await api.delete(`/expenses/${deleteModal.id}`);
            toast.success('খরচ মুছে ফেলা হয়েছে');
            fetchExpenses();
        }
        catch (error) { toast.error(error.response?.data?.message || 'খরচ মুছতে সমস্যা হয়েছে'); }
        finally { hideLoading(); }
    };

    const handleExport = (type) => {
        const columns = [
            { header: 'তারিখ', dataKey: 'date' },
            { header: 'শিরোনাম', dataKey: 'title' },
            { header: 'বিভাগ', dataKey: 'category' },
            { header: 'পরিমাণ (৳)', dataKey: 'amount' }
        ];

        const data = expenses.map(e => ({
            date: new Date(e.date).toLocaleDateString('bn-BD'),
            title: e.title,
            category: e.category,
            amount: e.amount
        }));

        if (type === 'pdf') exportToPDF(data, columns, 'expenses_report', 'Expenses Report');
        else exportToExcel(data, columns, 'expenses_report');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900 font-bengali">খরচের তালিকা</h1>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100 font-bengali active:scale-95"
                    >
                        <FileSpreadsheet size={18} /> Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex-1 sm:flex-none justify-center bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-100 font-bengali active:scale-95"
                    >
                        <FilePdf size={18} /> PDF
                    </button>
                    {user?.role === 'Admin' && (
                        <button
                            onClick={() => { setEditId(null); setFormData({ title: '', amount: '', category: 'Office', date: new Date().toISOString().split('T')[0], note: '', receipt: '' }); setReceiptFile(null); setReceiptPreview(null); setIsModalOpen(true); }}
                            className="w-full sm:w-auto justify-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-100 font-bengali active:scale-95"
                        >
                            <Plus size={20} /> + Add Expense
                        </button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? 'খরচের তথ্য আপডেট করুন' : 'নতুন খরচ যোগ করুন'}
                maxWidth="max-w-2xl"
            >
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">শিরোনাম (Title)</label>
                                <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">পরিমাণ (৳)</label>
                                <input required type="number" min="1" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">বিভাগ (Category)</label>
                                <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all bg-white">
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">তারিখ (Date)</label>
                                <input required type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">নোট (ঐচ্ছিক)</label>
                            <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" rows="2"></textarea>
                        </div>

                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">রশিদ (Receipt)</label>
                            <div className="mt-1 flex items-center gap-4 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                {receiptPreview ? (
                                    <div className="relative group h-20 w-20">
                                        <img src={receiptPreview} alt="Receipt Preview" className="h-full w-full rounded-lg object-cover border shadow-sm" />
                                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-lg">
                                            <button type="button" onClick={() => window.open(receiptPreview, '_blank')} className="text-white">
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                        <Plus size={24} />
                                    </div>
                                )}
                                <input type="file" accept="image/*,application/pdf" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setReceiptFile(file);
                                        setReceiptPreview(URL.createObjectURL(file));
                                    }
                                }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 font-bengali">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all">বাতিল (Cancel)</button>
                            <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="খরচ মুছে ফেলুন" message="আপনি কি নিশ্চিত যে এই খরচের রেকর্ডটি মুছে ফেলতে চান?" confirmText="Yes, Delete" />

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? <div className="p-8 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 font-bengali">
                                <tr>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">তারিখ</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">শিরোনাম</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">বিভাগ</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">রশিদ</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">পরিমাণ (৳)</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">এন্ট্রি তথ্য</th>
                                    {user?.role === 'Admin' && <th className="px-6 py-4 text-right text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense) => (
                                    <tr key={expense._id} className="hover:bg-gray-50 font-bengali">
                                        <td className="px-6 py-4 text-base text-gray-700">{new Date(expense.date).toLocaleDateString('bn-BD')}</td>
                                        <td className="px-6 py-4 text-base font-medium text-gray-900">{expense.title}</td>
                                        <td className="px-6 py-4 text-base text-gray-700">{expense.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {expense.receipt ? (
                                                <button onClick={() => window.open(`${FILE_BASE_URL}${expense.receipt}`, '_blank')} className="h-10 w-10 rounded border hover:border-primary-500 transition-colors flex items-center justify-center bg-gray-50 text-gray-400 hover:text-primary-600 overflow-hidden group">
                                                    {expense.receipt.toLowerCase().endsWith('.pdf') ? (
                                                        <FilePdf size={20} />
                                                    ) : (
                                                        <img src={`${FILE_BASE_URL}${expense.receipt}`} alt="receipt" className="h-full w-full object-cover" />
                                                    )}
                                                </button>
                                            ) : <span className="text-gray-300 text-xs">No Receipt</span>}
                                        </td>
                                        <td className="px-6 py-4 text-base font-bold text-red-600 font-bengali">৳{expense.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {expense.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(expense.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {expense.updatedBy && <div className="text-blue-400">আপডেট: {expense.updatedBy?.name}</div>}
                                        </td>
                                        {user?.role === 'Admin' && (
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Edit"><Edit2 size={20} /></button>
                                                <button onClick={() => setDeleteModal({ isOpen: true, id: expense._id })} className="text-red-600 hover:text-red-900 mx-2" title="Delete"><Trash2 size={20} /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {expenses.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">কোনো খরচের তথ্য পাওয়া যায়নি</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Expenses;
