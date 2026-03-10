import React, { useState, useEffect, useContext, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { FileSpreadsheet, FileText as FilePdf, Plus, Edit2, Trash2, Eye, Info, Contact, UserRound, Phone, MapPin, IdCard, History } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

import { FILE_BASE_URL } from '../config';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [formData, setFormData] = useState({ name: '', memberId: '', phone: '', address: '', status: 'Active', nid: '' });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [nidPhotoFile, setNidPhotoFile] = useState(null);
    const [nidPhotoPreview, setNidPhotoPreview] = useState(null);
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [depositHistory, setDepositHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const idCardRef = useRef(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/members');
            setMembers(data);
        } catch (error) {
            toast.error('সদস্যের তথ্য লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleInputChange = (e) => {
        if (e.target.type === 'file') {
            const file = e.target.files[0];
            if (e.target.name === 'photo') {
                setPhotoFile(file);
                setPhotoPreview(URL.createObjectURL(file));
            } else if (e.target.name === 'nidPhoto') {
                setNidPhotoFile(file);
                setNidPhotoPreview(URL.createObjectURL(file));
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (photoFile) data.append('photo', photoFile);
            if (nidPhotoFile) data.append('nidPhoto', nidPhotoFile);

            if (editId) {
                await api.put(`/members/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('সদস্যের তথ্য আপডেট করা হয়েছে');
            } else {
                await api.post('/members', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('নতুন সদস্য সফলভাবে যোগ করা হয়েছে');
            }
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ name: '', memberId: '', phone: '', address: '', status: 'Active', nid: '' });
            setPhotoFile(null);
            setPhotoPreview(null);
            setNidPhotoFile(null);
            setNidPhotoPreview(null);
            fetchMembers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'সদস্য সংরক্ষণ করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const handleEdit = (member) => {
        setEditId(member._id);
        setFormData({
            name: member.name,
            memberId: member.memberId,
            phone: member.phone,
            address: member.address,
            status: member.status,
            nid: member.nid || ''
        });
        setPhotoPreview(member.photo ? `${FILE_BASE_URL}${member.photo}` : null);
        setNidPhotoPreview(member.nidPhoto ? `${FILE_BASE_URL}${member.nidPhoto}` : null);
        setPhotoFile(null);
        setNidPhotoFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            showLoading();
            await api.delete(`/members/${deleteModal.id}`);
            toast.success('সদস্য মুছে ফেলা হয়েছে');
            fetchMembers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'সদস্য মুছতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const handleViewDetails = (member) => {
        setSelectedMember(member);
        setIsDetailsModalOpen(true);
    };

    const handleViewIdCard = (member) => {
        setSelectedMember(member);
        setIsIdCardModalOpen(true);
    };

    const handleViewHistory = async (member) => {
        setSelectedMember(member);
        setIsHistoryModalOpen(true);
        try {
            setHistoryLoading(true);
            const { data } = await api.get(`/deposits/member/${member._id}`);
            setDepositHistory(data);
        } catch (error) {
            toast.error('জমার ইতিহাস লোড করতে সমস্যা হয়েছে');
        } finally {
            setHistoryLoading(false);
        }
    };

    const downloadIdCard = async () => {
        if (!idCardRef.current) return;
        try {
            showLoading();
            const canvas = await html2canvas(idCardRef.current, {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width / 4, canvas.height / 4]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 4, canvas.height / 4);
            pdf.save(`ID_Card_${selectedMember.memberId}.pdf`);
            toast.success('আইডি কার্ড ডাউনলোড সফল হয়েছে');
        } catch (error) {
            console.error(error);
            toast.error('আইডি কার্ড তৈরি করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };



    const openModalForNew = () => {
        setEditId(null);
        setFormData({ name: '', memberId: '', phone: '', address: '', status: 'Active', nid: '' });
        setPhotoFile(null);
        setPhotoPreview(null);
        setNidPhotoFile(null);
        setNidPhotoPreview(null);
        setIsModalOpen(true);
    };

    const handleExport = (type) => {
        const columns = [
            { header: 'সদস্য আইডি', dataKey: 'memberId' },
            { header: 'নাম', dataKey: 'name' },
            { header: 'ফোন', dataKey: 'phone' },
            { header: 'মোট জমা (৳)', dataKey: 'totalDeposit' },
            { header: 'লভ্যাংশ (৳)', dataKey: 'totalProfitShare' },
            { header: 'স্ট্যাটাস', dataKey: 'status' }
        ];

        const data = members.map(m => ({
            ...m,
            totalDeposit: m.totalDeposit || 0,
            totalProfitShare: m.totalProfitShare || 0,
            status: m.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'
        }));

        if (type === 'pdf') exportToPDF(data, columns, 'members_list', 'Members List Report');
        else exportToExcel(data, columns, 'members_list');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900 font-bengali">সদস্য তালিকা</h1>
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
                            + Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editId ? 'সদস্যের তথ্য আপডেট করুন' : 'নতুন সদস্য যোগ করুন'}
                maxWidth="max-w-2xl"
            >
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">সদস্যের নাম</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">সদস্য আইডি</label>
                                <input required type="text" name="memberId" value={formData.memberId} onChange={handleInputChange} disabled={!!editId} className={`mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all ${editId ? 'bg-gray-50 text-gray-500' : ''}`} />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">ফোন নম্বর</label>
                                <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">এনআইডি (NID) নম্বর</label>
                                <input type="text" name="nid" value={formData.nid} onChange={handleInputChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">ঠিকানা</label>
                            <textarea name="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" rows="2"></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">সদস্যের ছবি</label>
                                <div className="mt-1 flex items-center gap-4 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover border-2 border-primary-500 shadow-sm" />
                                    ) : (
                                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                            <Plus size={24} />
                                        </div>
                                    )}
                                    <input type="file" name="photo" accept="image/*" onChange={handleInputChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">NID ছবি (ঐচ্ছিক)</label>
                                <div className="mt-1 flex items-center gap-4 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                    {nidPhotoPreview ? (
                                        <div className="relative group h-16 w-16">
                                            <img src={nidPhotoPreview} alt="NID Preview" className="h-full w-full rounded-lg border object-cover shadow-sm" />
                                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-lg">
                                                <button type="button" onClick={() => window.open(nidPhotoPreview, '_blank')} className="text-white">
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                            <Plus size={24} />
                                        </div>
                                    )}
                                    <input type="file" name="nidPhoto" accept="image/*,application/pdf" onChange={handleInputChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        {editId && (
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="block text-base font-medium text-gray-700 font-bengali mb-2">সদস্যের বর্তমান স্ট্যাটাস</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all bg-white">
                                    <option value="Active">সক্রিয় (Active)</option>
                                    <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 font-bengali">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all">বাতিল (Cancel)</button>
                            <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                {editId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="সদস্য মুছে ফেলুন"
                message="আপনি কি নিশ্চিত যে এই সদস্যকে মুছে ফেলতে চান? এই পদক্ষেপটি স্থায়ী এবং ফেরানো যাবে না।"
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
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">সদস্য</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">যোগাযোগ ও NID</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">মোট জমা (৳)</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">লভ্যাংশ (৳)</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">স্ট্যাটাস</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">এন্ট্রি তথ্য</th>
                                    <th className="px-6 py-4 text-right text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {members.map((member) => (
                                    <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border">
                                                    {member.photo ? (
                                                        <img src={`${FILE_BASE_URL}${member.photo}`} alt={member.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-base font-bold text-gray-900">{member.name}</div>
                                                    <div className="text-sm text-gray-500 font-bengali">ID: {member.memberId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-base text-gray-700">{member.phone}</div>
                                            <div className="text-xs text-gray-400 font-hindi">NID: {member.nid || 'তথ্য নেই'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">{member.totalDeposit?.toLocaleString() || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-green-600">{member.totalProfitShare?.toLocaleString() || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bengali">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {member.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {member.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(member.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {member.updatedBy && <div className="text-blue-400">আপডেট: {member.updatedBy?.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleViewIdCard(member)} className="text-green-600 hover:text-green-900 mx-2" title="Generate ID Card">
                                                <Contact size={22} />
                                            </button>
                                            <button onClick={() => handleViewHistory(member)} className="text-orange-600 hover:text-orange-900 mx-2" title="Deposit History">
                                                <History size={22} />
                                            </button>
                                            <button onClick={() => handleViewDetails(member)} className="text-blue-600 hover:text-blue-900 mx-2" title="Details">
                                                <Info size={22} />
                                            </button>
                                            {user?.role === 'Admin' && (
                                                <>
                                                    <button onClick={() => handleEdit(member)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Edit">
                                                        <Edit2 size={20} />
                                                    </button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, id: member._id })} className="text-red-600 hover:text-red-900 mx-2" title="Delete">
                                                        <Trash2 size={20} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">কোনো সদস্যের তথ্য পাওয়া যায়নি</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title="সদস্যের বিস্তারিত তথ্য"
                maxWidth="max-w-3xl"
            >
                {selectedMember && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left: Photos */}
                            <div className="w-full md:w-1/3 flex flex-col gap-6">
                                <div className="space-y-2 text-center">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-bengali">সদস্যের ছবি</h4>
                                    <div className="h-48 w-full rounded-2xl bg-gray-50 border-2 border-primary-100 flex items-center justify-center overflow-hidden shadow-inner">
                                        {selectedMember.photo ? (
                                            <img src={`${FILE_BASE_URL}${selectedMember.photo}`} alt={selectedMember.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="text-gray-300 font-bold text-5xl font-bengali">{selectedMember.name.charAt(0)}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 text-center text-bengali">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">এনআইডি (NID) কার্ড</h4>
                                    <div className="h-48 w-full rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-inner cursor-pointer group" onClick={() => selectedMember.nidPhoto && window.open(`${FILE_BASE_URL}${selectedMember.nidPhoto}`, '_blank')}>
                                        {selectedMember.nidPhoto ? (
                                            <div className="relative h-full w-full">
                                                <img src={`${FILE_BASE_URL}${selectedMember.nidPhoto}`} alt="NID" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye className="text-white" size={32} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-300 text-sm italic">ছবি নেই</div>
                                        )}
                                    </div>
                                    {selectedMember.nidPhoto && <p className="text-xs text-primary-600 font-medium">ছবিটি বড় করে দেখতে উপরে ক্লিক করুন</p>}
                                </div>
                            </div>

                            {/* Right: Info List */}
                            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                <div className="sm:col-span-2 pb-4 border-b border-gray-100">
                                    <h2 className="text-3xl font-extrabold text-gray-900 font-bengali">{selectedMember.name}</h2>
                                    <span className={`mt-2 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedMember.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} font-bengali`}>
                                        {selectedMember.status === 'Active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500 font-bengali">সদস্য আইডি</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedMember.memberId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500 font-bengali">ফোন নম্বর</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedMember.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500 font-bengali">এনআইডি নম্বর</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedMember.nid || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-500 font-bengali">ঠিকানা</p>
                                    <p className="text-lg font-bold text-gray-900 font-bengali leading-relaxed">{selectedMember.address || 'তথ্য নেই'}</p>
                                </div>

                                <div className="sm:col-span-2 grid grid-cols-2 gap-4 pt-4 mt-2 bg-primary-50 p-4 rounded-2xl border border-primary-100">
                                    <div className="text-center">
                                        <p className="text-xs text-primary-600 font-bold uppercase font-bengali">মোট জমা</p>
                                        <p className="text-2xl font-black text-primary-900">৳{selectedMember.totalDeposit?.toLocaleString() || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-primary-600 font-bold uppercase font-bengali">মোট লভ্যাংশ</p>
                                        <p className="text-2xl font-black text-green-600">৳{selectedMember.totalProfitShare?.toLocaleString() || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-10 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all font-bengali"
                            >
                                বন্ধ করুন
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ID Card Modal */}
            <Modal
                isOpen={isIdCardModalOpen}
                onClose={() => setIsIdCardModalOpen(false)}
                title="সদস্য আইডি কার্ড"
                maxWidth="max-w-2xl"
            >
                {selectedMember && (
                    <div className="p-8 flex flex-col items-center">
                        {/* ID Card Design Container - Super-Premium 3.0 (Horizontal) */}
                        <div
                            ref={idCardRef}
                            className="w-[500px] h-[300px] bg-white shadow-2xl rounded-[2.5rem] overflow-hidden relative border border-gray-100 flex flex-col font-sans select-none"
                        >
                            {/* Sophisticated Mesh Gradient Background */}
                            <div className="absolute inset-0 opacity-40">
                                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] rounded-full bg-gradient-to-br from-primary-400/20 to-transparent blur-3xl"></div>
                                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] rounded-full bg-gradient-to-tl from-indigo-400/20 to-transparent blur-3xl"></div>
                            </div>

                            {/* Subtle Geometric Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

                            {/* Luxury Accent Border */}
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary-600"></div>

                            {/* Header Section */}
                            <div className="flex items-start justify-between px-12 pt-10 pb-2 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <div className="absolute -inset-2 bg-primary-600/10 rounded-2xl blur-md"></div>
                                        <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-primary-50 relative">
                                            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 font-bengali tracking-tight leading-none">স্বপ্নের বাতিঘর</h3>
                                        <p className="text-[9px] text-primary-600 font-black uppercase tracking-[0.4em] mt-1.5 opacity-80">Premium Membership</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="h-10 w-10 rounded-full border-2 border-primary-100 flex items-center justify-center text-primary-600 bg-white shadow-sm overflow-hidden">
                                        <div className="absolute inset-0 bg-primary-600/5 rotate-45"></div>
                                        <IdCard size={20} className="relative z-10 opacity-40" />
                                    </div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-2">Certified ID</p>
                                </div>
                            </div>

                            {/* Main Identity Section */}
                            <div className="flex-1 flex px-12 gap-10 items-center relative z-10">
                                {/* Profile Aura Frame */}
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/10 to-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
                                    <div className="h-36 w-36 rounded-full p-1 bg-gradient-to-br from-primary-400 via-white to-indigo-500 shadow-2xl relative">
                                        <div className="h-full w-full rounded-full bg-white overflow-hidden border-[6px] border-white">
                                            {selectedMember.photo ? (
                                                <img src={`${FILE_BASE_URL}${selectedMember.photo}`} alt={selectedMember.name} className="h-full w-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500" crossOrigin="anonymous" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-200">
                                                    <UserRound size={56} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Gold Authentication Seal */}
                                    <div className="absolute bottom-1 right-1 h-9 w-9 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-white">
                                        <div className="h-6 w-6 border border-white/40 rounded-full flex items-center justify-center">
                                            <span className="text-[10px] font-black italic">S</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Information */}
                                <div className="flex-1 space-y-5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-primary-500 font-black uppercase tracking-[0.2em]">Full Name</p>
                                        <h2 className="text-3xl font-black text-gray-900 font-bengali leading-none">{selectedMember.name}</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mb-1.5">Member Code</p>
                                            <p className="text-sm font-black text-indigo-900 font-mono bg-indigo-50 px-2 py-0.5 rounded-md inline-block">#{selectedMember.memberId}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mb-1.5">Primary Contact</p>
                                            <p className="text-sm font-black text-gray-800 tracking-tight">{selectedMember.phone}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <MapPin size={8} className="text-primary-400" />
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em]">Authorized Address</p>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-700 font-bengali line-clamp-1 italic">{selectedMember.address || 'Standard Member Records'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Refined Luxury Footer */}
                            <div className="px-12 pb-10 flex items-end justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="w-24 h-[2px] bg-gradient-to-r from-gray-200 to-transparent"></div>
                                        <p className="text-[9px] text-gray-400 font-bold italic tracking-wide">Executive Signature</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1 mb-1">
                                            <div className="h-1 w-1 rounded-full bg-primary-400"></div>
                                            <p className="text-[7px] text-gray-400 font-black uppercase tracking-[0.4em]">Validity</p>
                                        </div>
                                        <p className="text-xs font-black text-gray-900 tracking-wider">DEC 2026</p>
                                    </div>

                                    {/* Minimalist Tech Signature (QR) */}
                                    <div className="relative group">
                                        <div className="absolute -inset-1.5 bg-primary-600/5 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="h-12 w-12 bg-white border border-gray-100 rounded-xl p-1 shadow-sm relative overflow-hidden flex flex-wrap gap-[1.5px]">
                                            {Array.from({ length: 25 }).map((_, i) => (
                                                <div key={i} className={`h-1.5 w-1.5 rounded-[1px] ${Math.random() > 0.6 ? 'bg-primary-950' : 'bg-primary-100/30'}`}></div>
                                            ))}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4 w-full max-w-[500px]">
                            <button
                                onClick={() => setIsIdCardModalOpen(false)}
                                className="flex-1 py-4 px-6 bg-white border-2 border-gray-100 border-dashed hover:border-gray-300 hover:bg-gray-50 text-gray-500 font-black rounded-3xl transition-all font-bengali uppercase tracking-widest text-[xs]"
                            >
                                Close Preview
                            </button>
                            <button
                                onClick={downloadIdCard}
                                className="flex-[2] py-4 px-8 bg-gray-900 hover:bg-black text-white font-black rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-3 font-bengali uppercase tracking-[0.15em] text-xs"
                            >
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <FilePdf size={16} />
                                </div>
                                Export Luxury ID Card (PDF)
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Deposit History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={selectedMember ? `${selectedMember.name} এর জমার ইতিহাস` : 'জমার ইতিহাস'}
                maxWidth="max-w-4xl"
            >
                <div className="p-6">
                    {historyLoading ? (
                        <div className="p-12 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 font-bengali">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">তারিখ</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ধরন</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">পরিমাণ (৳)</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">মন্তব্য</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100 font-bengali">
                                        {depositHistory.map((deposit) => (
                                            <tr key={deposit._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {new Date(deposit.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${deposit.type === 'Monthly' ? 'bg-blue-100 text-blue-800' :
                                                        deposit.type === 'One-time' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {deposit.type === 'Monthly' ? 'মাসিক জমা' :
                                                            deposit.type === 'One-time' ? 'এককালীন' :
                                                                'প্রকল্প ফেরত'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {deposit.amount.toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {deposit.note || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {depositHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">এখনও কোনো জমা পাওয়া যায়নি</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-100">
                                        <tr>
                                            <td colSpan="2" className="px-6 py-4 text-right text-sm font-black text-gray-500 uppercase tracking-wider font-bengali">মোট জমা (সব মিলিয়ে)</td>
                                            <td className="px-6 py-4 text-sm font-black text-primary-600">{depositHistory.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ৳</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all font-bengali"
                                >
                                    বন্ধ করুন
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Members;
