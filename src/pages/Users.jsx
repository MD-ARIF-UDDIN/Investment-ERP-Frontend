import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Plus, Edit2, Trash2, ShieldCheck, User } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user: currentUser } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Member' });
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/users');
            setUsers(data);
        } catch {
            toast.error('ব্যবহারকারীর তথ্য লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            const payload = { name: formData.name, email: formData.email, role: formData.role };
            if (formData.password) payload.password = formData.password;

            if (editId) {
                await api.put(`/users/${editId}`, payload);
                toast.success('ব্যবহারকারী আপডেট করা হয়েছে');
            } else {
                if (!formData.password) {
                    hideLoading();
                    return toast.error('পাসওয়ার্ড দিন');
                }
                await api.post('/users', { ...payload, password: formData.password });
                toast.success('নতুন ব্যবহারকারী তৈরি করা হয়েছে');
            }
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ name: '', email: '', password: '', role: 'Member' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const handleEdit = (u) => {
        setEditId(u._id);
        setFormData({ name: u.name, email: u.email, password: '', role: u.role });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            showLoading();
            await api.delete(`/users/${deleteModal.id}`);
            toast.success('ব্যবহারকারী মুছে ফেলা হয়েছে');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'মুছতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    // Remove hard block to allow view-only access
    // if (currentUser?.role !== 'Admin') {
    //     return <div className="p-8 text-center text-red-600 font-bold font-bengali">এই পেজে আপনার প্রবেশাধিকার নেই।</div>;
    // }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-bengali">ব্যবহারকারী ব্যবস্থাপনা</h1>
                {currentUser?.role === 'Admin' && (
                    <button
                        onClick={() => { setEditId(null); setFormData({ name: '', email: '', password: '', role: 'Member' }); setIsModalOpen(true); }}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> + Add User
                    </button>
                )}
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm font-bengali text-blue-800 flex gap-3">
                <ShieldCheck size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <strong>ভূমিকার সংজ্ঞা:</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                        <li><strong>Admin:</strong> সিস্টেমের সমস্ত কার্যক্রম পরিচালনা করতে পারবেন (তৈরি, সম্পাদনা, মুছে ফেলা)।</li>
                        <li><strong>Member:</strong> শুধুমাত্র তথ্য দেখতে পারবেন, কোনো পরিবর্তন করতে পারবেন না।</li>
                    </ul>
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 font-bengali">{editId ? 'ব্যবহারকারী আপডেট করুন' : 'নতুন ব্যবহারকারী তৈরি করুন'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">নাম</label>
                            <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" placeholder="পূর্ণ নাম দিন" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">ইমেইল</label>
                            <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" placeholder="example@email.com" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">
                                পাসওয়ার্ড {editId && <span className="text-gray-400 font-normal text-xs">(পরিবর্তন না করলে খালি রাখুন)</span>}
                            </label>
                            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" placeholder={editId ? 'নতুন পাসওয়ার্ড (ঐচ্ছিক)' : 'পাসওয়ার্ড দিন'} minLength={editId ? 0 : 6} />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">ভূমিকা (Role)</label>
                            <select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base">
                                <option value="Member">Member — শুধু দেখার অ্যাক্সেস</option>
                                <option value="Admin">Admin — সম্পূর্ণ অ্যাক্সেস</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 font-bengali">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editId ? 'Update' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="ব্যবহারকারী মুছে ফেলুন"
                message="আপনি কি নিশ্চিত যে এই ব্যবহারকারীকে মুছে ফেলতে চান? এই অ্যাকাউন্টটি আর লগইন করতে পারবে না।"
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
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">নাম</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">ইমেইল</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">ভূমিকা</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">এন্ট্রি তথ্য</th>
                                    {currentUser?.role === 'Admin' && <th className="px-6 py-4 text-right text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-base">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-base font-medium text-gray-900">{u.name}</span>
                                                {u._id === currentUser._id && (
                                                    <span className="text-sm text-gray-400 italic">(আপনি)</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 font-bengali">{u.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.role === 'Admin' ? <ShieldCheck size={14} /> : <User size={14} />}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {u.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(u.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {u.updatedBy && <div className="text-blue-400">আপডেট: {u.updatedBy?.name}</div>}
                                        </td>
                                        {currentUser?.role === 'Admin' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(u)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Edit">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: u._id })}
                                                    disabled={u._id === currentUser._id}
                                                    className={`mx-2 ${u._id === currentUser._id ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                                                    title={u._id === currentUser._id ? 'নিজের অ্যাকাউন্ট মোছা যাবে না' : 'Delete'}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">কোনো ব্যবহারকারীর তথ্য পাওয়া যায়নি</td>
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

export default Users;
