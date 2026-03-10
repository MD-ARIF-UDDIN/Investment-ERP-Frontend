import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import {
    FileSpreadsheet,
    FileText as FilePdf,
    Plus,
    Edit2,
    Trash2,
    Receipt,
    Share2,
    Send,
    Calendar,
    User,
    Hash,
    Banknote,
    QrCode,
    CheckCircle2,
    MapPin,
    Phone,
    Filter,
    XCircle,
    Search
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Deposits = () => {
    const [deposits, setDeposits] = useState([]);
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    const [formData, setFormData] = useState({
        depositFor: 'Member',
        memberId: '',
        projectId: '',
        amount: '',
        type: 'Monthly',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    // Invoice State
    const [selectedDeposit, setSelectedDeposit] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const invoiceRef = useRef(null);

    // Filter State
    const [filters, setFilters] = useState({
        member: '',
        month: '',
        year: new Date().getFullYear().toString()
    });

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = [
        { value: '1', label: 'জানুয়ারি' },
        { value: '2', label: 'ফেব্রুয়ারি' },
        { value: '3', label: 'মার্চ' },
        { value: '4', label: 'এপ্রিল' },
        { value: '5', label: 'মে' },
        { value: '6', label: 'জুন' },
        { value: '7', label: 'জুলাই' },
        { value: '8', label: 'আগস্ট' },
        { value: '9', label: 'সেপ্টেম্বর' },
        { value: '10', label: 'অক্টোবর' },
        { value: '11', label: 'নভেম্বর' },
        { value: '12', label: 'ডিসেম্বর' }
    ];

    const FILE_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.member) params.member = filters.member;
            if (filters.month) params.month = filters.month;
            if (filters.year) params.year = filters.year;

            const [depositsRes, membersRes, projectsRes] = await Promise.all([
                api.get('/deposits', { params }),
                api.get('/members'),
                api.get('/projects')
            ]);
            setDeposits(depositsRes.data);
            setMembers(membersRes.data.filter(m => m.status === 'Active'));
            setProjects(projectsRes.data.filter(p => p.status === 'Running'));
        } catch {
            toast.error('ডেটা লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const resetFilters = () => {
        setFilters({
            member: '',
            month: '',
            year: new Date().getFullYear().toString()
        });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            if (editId) {
                await api.put(`/deposits/${editId}`, formData);
                toast.success('জমা আপডেট করা হয়েছে');
            } else {
                await api.post('/deposits', formData);
                toast.success('নতুন জমা সফলভাবে যোগ করা হয়েছে');
            }
            setIsModalOpen(false);
            setEditId(null);
            setFormData({ depositFor: 'Member', memberId: '', projectId: '', amount: '', type: 'Monthly', date: new Date().toISOString().split('T')[0], note: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'জমা সংরক্ষণ করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const handleEdit = (deposit) => {
        setEditId(deposit._id);
        const isProject = deposit.depositFor === 'Project';
        setFormData({
            depositFor: deposit.depositFor || 'Member',
            memberId: deposit.member?._id || deposit.member || '',
            projectId: deposit.project?._id || deposit.project || '',
            amount: deposit.amount,
            type: deposit.type,
            date: new Date(deposit.date).toISOString().split('T')[0],
            note: deposit.note || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        try {
            showLoading();
            await api.delete(`/deposits/${deleteModal.id}`);
            toast.success('জমা মুছে ফেলা হয়েছে');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'জমা মুছতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const openModalForNew = () => {
        setEditId(null);
        setFormData({ depositFor: 'Member', memberId: '', projectId: '', amount: '', type: 'Monthly', date: new Date().toISOString().split('T')[0], note: '' });
        setIsModalOpen(true);
    };

    const handleExport = (type) => {
        const columns = [
            { header: 'তারিখ', dataKey: 'date' },
            { header: 'উৎস/সদস্য', dataKey: 'sourceName' },
            { header: 'আইডি', dataKey: 'sourceId' },
            { header: 'ধরন', dataKey: 'typeText' },
            { header: 'পরিমাণ (৳)', dataKey: 'amount' },
            { header: 'নোট', dataKey: 'note' }
        ];

        const data = deposits.map(d => ({
            date: new Date(d.date).toLocaleDateString('bn-BD'),
            sourceName: d.depositFor === 'Project' ? d.project?.name : d.member?.name,
            sourceId: d.depositFor === 'Project' ? 'প্রকল্প' : d.member?.memberId,
            typeText: d.type === 'Monthly' ? 'মাসিক' : d.type === 'One-time' ? 'এককালীন' : d.type === 'Income' ? 'আয়' : d.type === 'Profit' ? 'লাভ' : 'প্রকল্প আয়',
            amount: d.amount,
            note: d.note || '-'
        }));

        if (type === 'pdf') exportToPDF(data, columns, 'deposits_report', 'Deposits Transaction Report');
        else exportToExcel(data, columns, 'deposits_report');
    };

    const handleViewInvoice = (deposit) => {
        setSelectedDeposit(deposit);
        setWhatsappNumber(deposit.member?.phone || '');
        setIsInvoiceModalOpen(true);
    };

    const downloadInvoice = async () => {
        if (!invoiceRef.current) return;
        try {
            showLoading();
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 3, canvas.height / 3]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
            pdf.save(`Receipt_${selectedDeposit.member?.memberId}_${new Date(selectedDeposit.date).getTime()}.pdf`);
            toast.success('মানি রিসিট ডাউনলোড সফল হয়েছে');
        } catch (error) {
            console.error(error);
            toast.error('রিসিট তৈরি করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const shareToWhatsApp = () => {
        if (!whatsappNumber) {
            toast.error('দয়া করে হোয়াটসঅ্যাপ নম্বর দিন');
            return;
        }

        const formattedDate = new Date(selectedDeposit.date).toLocaleDateString('bn-BD');
        const message = `*জমা রিসিট - স্বপ্নের বাতিঘর*\n\n` +
            (selectedDeposit.depositFor === 'Project' ?
                `প্রকল্প: ${selectedDeposit.project?.name}\n`
                : `সদস্য: ${selectedDeposit.member?.name}\nসদস্য আইডি: ${selectedDeposit.member?.memberId}\n`
            ) +
            `তারিখ: ${formattedDate}\n` +
            `জমার ধরন: ${selectedDeposit.type === 'Monthly' ? 'মাসিক' : selectedDeposit.type === 'One-time' ? 'এককালীন' : selectedDeposit.type === 'Income' ? 'আয়' : selectedDeposit.type === 'Profit' ? 'লাভ' : 'প্রকল্প আয়'}\n` +
            `পরিমাণ: ৳${selectedDeposit.amount.toLocaleString()}\n` +
            `অবস্থা: সফলভাবে জমা হয়েছে\n\n` +
            `ধন্যবাদান্তে,\nস্বপ্নের বাতিঘর পরিবার।`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/88${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-bengali">জমার তালিকা</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleExport('excel')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                    >
                        <FileSpreadsheet size={20} /> Excel
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                    >
                        <FilePdf size={20} /> PDF
                    </button>
                    {user?.role === 'Admin' && (
                        <button
                            onClick={openModalForNew}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                        >
                            <Plus size={20} />
                            + নতুন জমা
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 font-bengali">
                            <User size={12} /> সদস্য ফিল্টার
                        </label>
                        <select
                            name="member"
                            value={filters.member}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary-100 transition-all font-bengali"
                        >
                            <option value="">সকল সদস্য</option>
                            {members.map(m => (
                                <option key={m._id} value={m._id}>{m.name} ({m.memberId})</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-40">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 font-bengali">
                            <Calendar size={12} /> মাস
                        </label>
                        <select
                            name="month"
                            value={filters.month}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary-100 transition-all font-bengali"
                        >
                            <option value="">সকল মাস</option>
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 font-bengali">
                            <Calendar size={12} /> বছর
                        </label>
                        <select
                            name="year"
                            value={filters.year}
                            onChange={handleFilterChange}
                            className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-primary-100 transition-all font-bengali"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={resetFilters}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-xl transition-all group"
                            title="ফিল্টার রিসেট করুন"
                        >
                            <XCircle size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Filter Status Summary */}
                {(filters.member || filters.month) && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary-600">
                        <CheckCircle2 size={12} />
                        ফিল্টার সক্রিয়: {filters.member ? members.find(m => m._id === filters.member)?.name : 'সকল সদস্য'}
                        {filters.month ? ` • ${months.find(m => m.value === filters.month)?.label}` : ''}
                        {` • ${filters.year}`}
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 font-bengali">{editId ? 'জমা আপডেট করুন' : 'নতুন জমা যোগ করুন'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-6 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="depositFor"
                                    value="Member"
                                    checked={formData.depositFor === 'Member'}
                                    onChange={(e) => {
                                        setFormData({ ...formData, depositFor: e.target.value, projectId: '', type: 'Monthly' });
                                    }}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    disabled={!!editId}
                                />
                                <span className="text-sm font-bold text-gray-700 font-bengali">সদস্য জমা</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="depositFor"
                                    value="Project"
                                    checked={formData.depositFor === 'Project'}
                                    onChange={(e) => {
                                        setFormData({ ...formData, depositFor: e.target.value, memberId: '', type: 'Income' });
                                    }}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                    disabled={!!editId}
                                />
                                <span className="text-sm font-bold text-gray-700 font-bengali">প্রকল্প জমা</span>
                            </label>
                        </div>

                        {formData.depositFor === 'Member' ? (
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">সদস্য নির্বাচন করুন</label>
                                <select required name="memberId" value={formData.memberId} onChange={handleInputChange} disabled={!!editId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base ${editId ? 'bg-gray-100' : ''}`}>
                                    <option value="">নির্বাচন করুন...</option>
                                    {members.map(m => (
                                        <option key={m._id} value={m._id}>{m.name} ({m.memberId})</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">প্রকল্প নির্বাচন করুন</label>
                                <select required name="projectId" value={formData.projectId} onChange={handleInputChange} disabled={!!editId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base ${editId ? 'bg-gray-100' : ''}`}>
                                    <option value="">নির্বাচন করুন...</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">জমার ধরন</label>
                            <select required name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base">
                                {formData.depositFor === 'Member' ? (
                                    <>
                                        <option value="Monthly">মাসিক</option>
                                        <option value="One-time">এককালীন</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Income">আয় (Income)</option>
                                        <option value="Profit">লাভ (Profit)</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">পরিমাণ (৳)</label>
                            <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">তারিখ</label>
                            <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" />
                        </div>
                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">নোট (ঐচ্ছিক)</label>
                            <textarea name="note" value={formData.note} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-2 border text-base" rows="2"></textarea>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 font-bengali">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editId ? 'Update' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Invoice Modal */}
            <Modal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                title="মানি রিসিট - মানি ট্রানজ্যাকশন"
                maxWidth="max-w-2xl"
            >
                {selectedDeposit && (
                    <div className="p-8 flex flex-col items-center">
                        {/* Receipt Container */}
                        <div
                            ref={invoiceRef}
                            className="w-full max-w-[500px] bg-white shadow-2xl rounded-3xl overflow-hidden relative border border-gray-100 flex flex-col font-sans select-none"
                        >
                            {/* Receipt Background Patterns */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-primary-600 to-indigo-700 px-10 py-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-xl shadow-lg">
                                            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-white text-xl font-black font-bengali leading-none">স্বপ্নের বাতিঘর</h3>
                                            <p className="text-primary-100 text-[10px] font-bold uppercase tracking-widest mt-1">Official Payment Receipt</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white text-[10px] font-black tracking-widest uppercase">
                                            VERIFIED
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Body */}
                            <div className="px-10 py-8 space-y-8 relative z-10">
                                {/* Metadata Row */}
                                <div className="flex justify-between items-start border-b border-gray-50 pb-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Hash size={10} className="text-primary-400" /> Receipt ID
                                        </p>
                                        <p className="text-sm font-black text-gray-900 font-mono">#{selectedDeposit._id.substring(selectedDeposit._id.length - 8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                                            <Calendar size={10} className="text-primary-400" /> Payment Date
                                        </p>
                                        <p className="text-sm font-black text-gray-900 leading-none">{new Date(selectedDeposit.date).toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Member/Project Information */}
                                <div className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-sm border border-primary-50">
                                                {selectedDeposit.depositFor === 'Project' ? <Banknote size={20} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                                                    {selectedDeposit.depositFor === 'Project' ? 'Project Name' : 'Received From'}
                                                </p>
                                                <h4 className="text-base font-black text-gray-900 font-bengali">
                                                    {selectedDeposit.depositFor === 'Project' ? selectedDeposit.project?.name : selectedDeposit.member?.name}
                                                </h4>
                                            </div>
                                        </div>
                                        {selectedDeposit.depositFor !== 'Project' && (
                                            <div className="text-right">
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Member ID</p>
                                                <p className="text-sm font-black text-primary-600 font-mono leading-none">{selectedDeposit.member?.memberId}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <Receipt size={10} className="text-primary-400" /> Deposit Nature
                                            </p>
                                            <div className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-tighter ${selectedDeposit.depositFor === 'Project' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'} border border-current/10`}>
                                                {selectedDeposit.type === 'Monthly' ? 'মাসিক জমা' : selectedDeposit.type === 'One-time' ? 'এককালীন জমা' : selectedDeposit.type === 'Income' ? 'প্রকল্প আয়' : selectedDeposit.type === 'Profit' ? 'প্রকল্প লাভ' : 'জমা'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                                                <Banknote size={10} className="text-primary-400" /> Total Received
                                            </p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter flex items-center justify-end gap-1">
                                                <span className="text-lg opacity-40 font-normal">৳</span> {selectedDeposit.amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedDeposit.note && (
                                        <div className="p-4 bg-yellow-50/30 rounded-xl border border-yellow-100 italic text-[11px] text-yellow-800 font-bengali">
                                            <strong>নোট:</strong> {selectedDeposit.note}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Receipt Footer */}
                            <div className="px-10 pb-10 flex items-end justify-between relative z-10">
                                <div className="space-y-2">
                                    <div className="w-24 h-[1px] bg-gray-200"></div>
                                    <p className="text-[10px] text-gray-400 font-bold italic tracking-wide">Manager's Approval</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right opacity-30">
                                        <p className="text-[7px] text-gray-400 font-black uppercase tracking-[0.4em]">Hash Signature</p>
                                        <p className="text-[8px] font-mono font-bold text-gray-900">{selectedDeposit._id}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-xl p-1.5 opacity-60 flex flex-wrap gap-[1px]">
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <div key={i} className={`h-2 w-2 rounded-[2px] ${Math.random() > 0.5 ? 'bg-primary-900' : 'bg-transparent'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Sharing Controls */}
                        <div className="mt-8 w-full max-w-[500px] space-y-6">
                            <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100 space-y-4">
                                <div className="flex items-center gap-3 text-primary-900">
                                    <Share2 size={18} className="animate-pulse" />
                                    <h4 className="text-sm font-black uppercase tracking-widest font-bengali">সরাসরি হোয়াটসঅ্যাপে দিন</h4>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={16} />
                                        <input
                                            type="tel"
                                            placeholder="WhatsApp Number"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-primary-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-100 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={shareToWhatsApp}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-xl shadow-green-100 flex items-center gap-2 transition-all group active:scale-95"
                                    >
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span className="font-bold text-sm font-bengali">পাঠান</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsInvoiceModalOpen(false)}
                                    className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-3xl transition-all font-bengali uppercase tracking-widest text-[xs]"
                                >
                                    বন্ধ করুন
                                </button>
                                <button
                                    onClick={downloadInvoice}
                                    className="flex-[2] py-4 px-8 bg-gray-900 hover:bg-black text-white font-black rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-3 font-bengali uppercase tracking-[0.15em] text-xs"
                                >
                                    <div className="bg-white/20 p-1.5 rounded-lg">
                                        <FilePdf size={16} />
                                    </div>
                                    ডাউনলোড রিসিট (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDelete}
                title="জমা মুছে ফেলুন"
                message="আপনি কি নিশ্চিত যে এই জমার রেকর্ডটি মুছে ফেলতে চান? এটি সদস্যের মোট জমার পরিমাণ থেকে বিয়োগ হবে।"
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
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">উৎস</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">ধরন</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">পরিমাণ (৳)</th>
                                    <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">নোট</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 tracking-wider">এন্ট্রি তথ্য</th>
                                    <th className="px-6 py-4 text-right text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                {deposits.sort((a, b) => new Date(b.date) - new Date(a.date)).map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">{new Date(deposit.date).toLocaleDateString('bn-BD')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                                            {deposit.depositFor === 'Project' ? (
                                                <span className="text-indigo-600">{deposit.project?.name} (প্রকল্প)</span>
                                            ) : (
                                                <span>{deposit.member?.name} ({deposit.member?.memberId})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${deposit.depositFor === 'Project' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                                {deposit.type === 'Monthly' ? 'মাসিক' : deposit.type === 'One-time' ? 'এককালীন' : deposit.type === 'Income' ? 'আয়' : deposit.type === 'Profit' ? 'লাভ' : deposit.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">{deposit.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-base text-gray-700">{deposit.note || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-bengali leading-tight">
                                            <div>তৈরি: {deposit.createdBy?.name || 'System'}</div>
                                            <div>তারিখ: {new Date(deposit.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            {deposit.updatedBy && <div className="text-blue-400">আপডেট: {deposit.updatedBy?.name}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleViewInvoice(deposit)} className="text-green-600 hover:text-green-900 mx-2" title="Invoice">
                                                <Receipt size={18} />
                                            </button>
                                            {user?.role === 'Admin' && (
                                                <>
                                                    <button onClick={() => handleEdit(deposit)} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Edit">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, id: deposit._id })} className="text-red-600 hover:text-red-900 mx-2" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {deposits.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">কোনো জমার তথ্য পাওয়া যায়নি</td>
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

export default Deposits;
