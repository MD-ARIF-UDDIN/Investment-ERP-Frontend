import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { FileSpreadsheet, FileText as FilePdf, Plus, Edit2, Trash2 } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [formData, setFormData] = useState({ memberId: '', projectId: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', type: 'Normal' });
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [withdrawalsRes, membersRes, projectsRes] = await Promise.all([
                api.get('/withdrawals'),
                api.get('/members'),
                api.get('/projects')
            ]);
            setWithdrawals(withdrawalsRes.data);
            setMembers(membersRes.data.filter(m => m.status === 'Active'));
            setProjects(projectsRes.data.filter(p => p.status === 'Running'));
        } catch {
            toast.error('ডেটা লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            if (editId) {
                await api.put(`/withdrawals/${editId}`, formData);
                toast.success('উত্তোলন আপডেট করা হয়েছে');
            } else {
                await api.post('/withdrawals', formData);
                toast.success('উত্তোলন সফলভাবে অনুমোদন করা হয়েছে');
            }
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ memberId: '', projectId: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', type: 'Normal' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'উত্তোলন সংরক্ষণ করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const handleEdit = (withdrawal) => {
        setEditId(withdrawal._id);
        setFormData({
            memberId: withdrawal.member?._id || withdrawal.member || '',
            projectId: withdrawal.project?._id || withdrawal.project || '',
            amount: withdrawal.amount,
            date: new Date(withdrawal.date).toISOString().split('T')[0],
            reason: withdrawal.reason || '',
            type: withdrawal.type || 'Normal'
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            showLoading();
            await api.delete(`/withdrawals/${deleteModal.id}`);
            toast.success('উত্তোলন মুছে ফেলা হয়েছে');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'উত্তোলন মুছতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const openModalForNew = () => {
        setEditId(null);
        setFormData({ memberId: '', projectId: '', amount: '', date: new Date().toISOString().split('T')[0], reason: '', type: 'Normal' });
        setIsModalOpen(true);
    };

    const handleExport = (type) => {
        const columns = [
            { header: 'তারিখ', dataKey: 'date' },
            { header: 'সদস্য', dataKey: 'memberName' },
            { header: 'সদস্য আইডি', dataKey: 'memberId' },
            { header: 'ধরণ', dataKey: 'type' },
            { header: 'পরিমাণ (৳)', dataKey: 'amount' },
            { header: 'কারণ', dataKey: 'reason' }
        ];

        const data = withdrawals.map(w => ({
            date: new Date(w.date).toLocaleDateString('bn-BD'),
            memberName: w.type === 'Project Investment' ? w.project?.name : w.member?.name,
            memberId: w.type === 'Project Investment' ? 'প্রকল্প' : w.member?.memberId,
            type: w.type === 'Profit' ? 'লভ্যাংশ' : w.type === 'Project Investment' ? 'প্রকল্প বিনিয়োগ' : 'সাধারণ',
            amount: w.amount,
            reason: w.reason || '-'
        }));

        if (type === 'pdf') exportToPDF(data, columns, 'withdrawals_report', 'Withdrawals Report');
        else exportToExcel(data, columns, 'withdrawals_report');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900 font-bengali">উত্তোলনের তালিকা</h1>
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
                            onClick={openModalForNew}
                            className="w-full sm:w-auto justify-center bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary-100 font-bengali active:scale-95"
                        >
                            <Plus size={20} />
                            + New Withdrawal
                        </button>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 font-bengali">{editId ? 'উত্তোলন আপডেট করুন' : 'নতুন উত্তোলন অনুমোদন করুন'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">উত্তোলনের ধরণ</label>
                            <select required name="type" value={formData.type} onChange={(e) => {
                                const newType = e.target.value;
                                setFormData({ ...formData, type: newType, memberId: '', projectId: '' });
                            }} disabled={!!editId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base ${editId ? 'bg-gray-100' : ''}`}>
                                <option value="Normal">সাধারণ (মেইন ব্যালেন্স)</option>
                                <option value="Profit">লভ্যাংশ (Distributed Profit)</option>
                                <option value="Project Investment">প্রকল্প বিনিয়োগ (Project Investment)</option>
                            </select>
                        </div>

                        {formData.type === 'Project Investment' ? (
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">প্রকল্প নির্বাচন করুন</label>
                                <select required name="projectId" value={formData.projectId} onChange={handleInputChange} disabled={!!editId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base ${editId ? 'bg-gray-100' : ''}`}>
                                    <option value="">নির্বাচন করুন...</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">সদস্য নির্বাচন করুন</label>
                                <select required name="memberId" value={formData.memberId} onChange={handleInputChange} disabled={!!editId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base ${editId ? 'bg-gray-100' : ''}`}>
                                    <option value="">নির্বাচন করুন...</option>
                                    {members.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.memberId}) - জমা: {m.totalDeposit}৳ | লভ্যাংশ: {(m.totalProfitShare || 0) - (m.withdrawnProfit || 0)}৳</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">পরিমাণ (৳)</label>
                            <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">তারিখ</label>
                            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">কারণ (ঐচ্ছিক)</label>
                            <textarea name="reason" value={formData.reason} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" rows="2"></textarea>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 font-bengali">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-hindi">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-hindi">{editId ? 'Update' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="উত্তোলন মুছে ফেলুন"
                message="আপনি কি নিশ্চিত যে এই উত্তোলনের রেকর্ডটি মুছে ফেলতে চান?"
                confirmText="Yes, Delete"
            />

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 font-bengali">
                                <tr>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">তারিখ</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">সদস্য / প্রকল্প</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">পরিমাণ (৳)</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">ধরন</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">কারণ</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">এন্ট্রি তথ্য</th>
                                    {user?.role === 'Admin' && <th className="px-6 py-4 text-right text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)).map((withdrawal) => (
                                    <tr key={withdrawal._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 font-bengali">{new Date(withdrawal.date).toLocaleDateString('bn-BD')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                                            {withdrawal.type === 'Project Investment' ? (
                                                <span className="text-purple-700">{withdrawal.project?.name} (প্রকল্প)</span>
                                            ) : (
                                                <span>{withdrawal.member?.name} ({withdrawal.member?.memberId})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-red-600">{withdrawal.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${withdrawal.type === 'Profit' ? 'bg-green-100 text-green-800' :
                                                withdrawal.type === 'Project Investment' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {withdrawal.type === 'Profit' ? 'লভ্যাংশ' : withdrawal.type === 'Project Investment' ? 'প্রকল্প বিনিয়োগ' : 'সাধারণ'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-base text-gray-700 font-bengali">{withdrawal.reason || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {withdrawal.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(withdrawal.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {withdrawal.updatedBy && <div className="text-blue-400">আপডেট: {withdrawal.updatedBy?.name}</div>}
                                        </td>
                                        {user?.role === 'Admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(withdrawal)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Edit">
                                                    <Edit2 size={20} />
                                                </button>
                                                <button onClick={() => setDeleteModal({ isOpen: true, id: withdrawal._id })} className="text-red-600 hover:text-red-900 mx-2" title="Delete">
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {withdrawals.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">কোনো উত্তোলনের তথ্য পাওয়া যায়নি</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Withdrawals;
