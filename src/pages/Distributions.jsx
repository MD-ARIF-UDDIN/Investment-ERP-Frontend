import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import Modal from '../components/Modal';
import { Plus, History, Calculator, Users, Wallet, ArrowRight } from 'lucide-react';

const Distributions = () => {
    const [distributions, setDistributions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [formData, setFormData] = useState({
        totalAmount: '',
        method: 'Equal',
        note: '',
    });

    const [previewShares, setPreviewShares] = useState([]);

    useEffect(() => {
        fetchDistributions();
        fetchMembers();
    }, []);

    useEffect(() => {
        calculatePreview();
    }, [formData.totalAmount, formData.method, members]);

    const fetchDistributions = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/distributions');
            setDistributions(data);
        } catch (error) {
            toast.error('বণ্টন ইতিহাস লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const { data } = await api.get('/members');
            setMembers(data.filter(m => m.status === 'Active'));
        } catch (error) {
            toast.error('সদস্য তালিকা লোড করতে সমস্যা হয়েছে');
        }
    };

    const calculatePreview = () => {
        const amount = Number(formData.totalAmount) || 0;
        if (amount <= 0 || members.length === 0) {
            setPreviewShares([]);
            return;
        }

        let shares = [];
        if (formData.method === 'Equal') {
            const perMember = amount / members.length;
            shares = members.map(m => ({
                member: m._id,
                name: m.name,
                memberId: m.memberId,
                amount: perMember
            }));
        } else if (formData.method === 'ByDeposit') {
            const totalDeposit = members.reduce((sum, m) => sum + (m.totalDeposit || 0), 0);
            if (totalDeposit > 0) {
                shares = members.map(m => ({
                    member: m._id,
                    name: m.name,
                    memberId: m.memberId,
                    amount: (amount * (m.totalDeposit || 0)) / totalDeposit
                }));
            }
        }
        setPreviewShares(shares);
    };

    const handleManualAmountChange = (memberId, value) => {
        const newShares = previewShares.map(s =>
            s.member === memberId ? { ...s, amount: Number(value) || 0 } : s
        );
        setPreviewShares(newShares);
        const total = newShares.reduce((sum, s) => sum + s.amount, 0);
        setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            const payload = {
                ...formData,
                totalAmount: Number(formData.totalAmount),
                manualShares: formData.method === 'Manual' ? previewShares : undefined
            };
            await api.post('/distributions', payload);
            toast.success('লভ্যাংশ সফলভাবে বণ্টন করা হয়েছে');
            setIsModalOpen(false);
            setFormData({ totalAmount: '', method: 'Equal', note: '' });
            fetchDistributions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'বণ্টন করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const openModal = () => {
        setFormData({ totalAmount: '', method: 'Equal', note: '' });
        setPreviewShares([]);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-bengali">লভ্যাংশ বণ্টন</h1>
                {user?.role === 'Admin' && (
                    <button
                        onClick={openModal}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                    >
                        <Plus size={20} /> নতুন বণ্টন
                    </button>
                )}
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <History size={20} className="text-gray-500" />
                    <h2 className="text-lg font-bold text-gray-700 font-bengali">বণ্টন ইতিহাস</h2>
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 font-bengali">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">তারিখ</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">পদ্ধতি</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">সদস্য সংখ্যা</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">মোট পরিমাণ</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">মন্তব্য</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">এন্ট্রি তথ্য</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {distributions.map((d) => (
                                    <tr key={d._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(d.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${d.method === 'Equal' ? 'bg-blue-100 text-blue-800' :
                                                d.method === 'ByDeposit' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                {d.method === 'Equal' ? 'সমান হারে' :
                                                    d.method === 'ByDeposit' ? 'জমার অনুপাতে' : 'ম্যানুয়াল'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {d.shares?.length || 0} জন
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                                            {d.totalAmount.toLocaleString()} ৳
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {d.note || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {d.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(d.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {d.updatedBy && <div className="text-blue-400">আপডেট: {d.updatedBy?.name}</div>}
                                        </td>
                                    </tr>
                                ))}
                                {distributions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">এখনও কোনো লভ্যাংশ বণ্টন করা হয়নি</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="নতুন লভ্যাংশ বণ্টন"
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 font-bengali">বণ্টন পদ্ধতি</label>
                            <select
                                value={formData.method}
                                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2.5 border"
                            >
                                <option value="Equal">সমান হারে (Equal)</option>
                                <option value="ByDeposit">জমার অনুপাতে (Proportional)</option>
                                <option value="Manual">ম্যানুয়াল (Manual)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 font-bengali">মোট লভ্যাংশ পরিমাণ</label>
                            <input
                                required
                                type="number"
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                disabled={formData.method === 'Manual'}
                                className={`mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2.5 border ${formData.method === 'Manual' ? 'bg-gray-50' : ''}`}
                                placeholder="৳ ০.০০"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 font-bengali">মন্তব্য (ঐচ্ছিক)</label>
                            <input
                                type="text"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2.5 border"
                                placeholder="বণ্টন সংক্রান্ত তথ্য..."
                            />
                        </div>
                    </div>

                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 font-bengali flex items-center gap-2">
                                <Users size={18} /> বণ্টনের প্রিভিউ ({previewShares.length} জন সক্রিয় সদস্য)
                            </h3>
                            {formData.totalAmount && (
                                <div className="text-primary-600 font-bold">
                                    মোট: {Number(formData.totalAmount).toLocaleString()} ৳
                                </div>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white sticky top-0">
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                        <th className="px-6 py-2 text-left">সদস্য</th>
                                        <th className="px-6 py-2 text-right">বণ্টনকৃত পরিমাণ (৳)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100 font-bengali">
                                    {(formData.method === 'Manual' ? members : previewShares).map((s) => {
                                        const share = formData.method === 'Manual' ? previewShares.find(ps => ps.member === s._id) : s;
                                        return (
                                            <tr key={s.member || s._id}>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{s.name}</div>
                                                    <div className="text-[10px] text-gray-500">ID: {s.memberId}</div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-right">
                                                    {formData.method === 'Manual' ? (
                                                        <input
                                                            type="number"
                                                            value={share?.amount || ''}
                                                            onChange={(e) => handleManualAmountChange(s._id, e.target.value)}
                                                            className="w-32 rounded border-gray-200 text-right p-1 text-sm font-bold focus:ring-primary-500 focus:border-primary-500"
                                                            placeholder="০"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-black text-primary-600">
                                                            {s.amount.toFixed(2)} ৳
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold transition-all font-bengali"
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            disabled={previewShares.length === 0 || Number(formData.totalAmount) <= 0}
                            className="px-10 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
                        >
                            <Calculator size={20} /> বণ্টন নিশ্চিত করুন
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Distributions;
