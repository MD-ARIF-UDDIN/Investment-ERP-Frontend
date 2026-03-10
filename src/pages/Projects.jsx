import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Plus, DollarSign, Edit2, Trash2, ChevronDown, ChevronUp, History, FileSpreadsheet, FileText as FilePdf } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const FILE_BASE_URL = 'https://investment-erp.onrender.com';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [expandedHistory, setExpandedHistory] = useState({});
    const { user } = useContext(AuthContext);
    const [projectFormData, setProjectFormData] = useState({ name: '', totalInvestment: '', startDate: new Date().toISOString().split('T')[0], status: 'Running' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editProjectId, setEditProjectId] = useState(null);
    const [deleteProjectModal, setDeleteProjectModal] = useState({ isOpen: false, id: null });
    const [paymentFormData, setPaymentFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });

    const { showLoading, hideLoading } = useLoading();

    const fetchProjects = async () => {
        try { setLoading(true); const { data } = await api.get('/projects'); setProjects(data); }
        catch { toast.error('প্রকল্পের তথ্য লোড করতে সমস্যা হয়েছে'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleProjectSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            const formData = new FormData();
            Object.keys(projectFormData).forEach(key => formData.append(key, projectFormData[key]));
            if (imageFile) formData.append('projectImage', imageFile);

            if (editProjectId) {
                await api.put(`/projects/${editProjectId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('প্রকল্প আপডেট করা হয়েছে');
            }
            else {
                await api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('নতুন প্রকল্প সফলভাবে যোগ করা হয়েছে');
            }
            setIsProjectModalOpen(false);
            setEditProjectId(null);
            setProjectFormData({ name: '', totalInvestment: '', startDate: new Date().toISOString().split('T')[0], status: 'Running' });
            setImageFile(null);
            setImagePreview(null);
            fetchProjects();
        } catch (error) { toast.error(error.response?.data?.message || 'সংরক্ষণ করতে সমস্যা হয়েছে'); }
        finally { hideLoading(); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleEditProject = (project) => {
        setEditProjectId(project._id);
        setProjectFormData({ name: project.name, totalInvestment: project.totalInvestment, startDate: new Date(project.startDate).toISOString().split('T')[0], status: project.status });
        setImagePreview(project.image ? `${FILE_BASE_URL}${project.image}` : null);
        setImageFile(null);
        setIsProjectModalOpen(true);
    };

    const handleDeleteProject = async () => {
        try {
            showLoading();
            await api.delete(`/projects/${deleteProjectModal.id}`);
            toast.success('প্রকল্প মুছে ফেলা হয়েছে');
            fetchProjects();
        }
        catch (error) { toast.error(error.response?.data?.message || 'প্রকল্পটিতে আয় থাকায় এটি মোছা যাবে না।'); }
        finally { hideLoading(); }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            await api.post(`/projects/${selectedProject._id}/payments`, paymentFormData);
            toast.success('প্রকল্পের আয় সফলভাবে যোগ করা হয়েছে');
            setIsPaymentModalOpen(false);
            setPaymentFormData({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
            fetchProjects();
        } catch (error) { toast.error(error.response?.data?.message || 'আয় যোগ করতে সমস্যা হয়েছে'); }
        finally { hideLoading(); }
    };

    const toggleHistory = (projectId) => {
        setExpandedHistory(prev => ({ ...prev, [projectId]: !prev[projectId] }));
    };

    const handleExport = (type) => {
        const columns = [
            { header: 'প্রকল্পের নাম', dataKey: 'name' },
            { header: 'বিনিয়োগ (৳)', dataKey: 'totalInvestment' },
            { header: 'মোট আয় (৳)', dataKey: 'totalReceived' },
            { header: 'লাভ/ক্ষতি (৳)', dataKey: 'currentProfit' },
            { header: 'অবস্থা', dataKey: 'statusText' }
        ];

        const data = projects.map(p => ({
            ...p,
            totalReceived: p.paymentsReceived.reduce((acc, curr) => acc + curr.amount, 0),
            statusText: p.status === 'Running' ? 'চলমান' : 'সম্পূর্ণ'
        }));

        if (type === 'pdf') exportToPDF(data, columns, 'projects_report', 'Projects Investment Report');
        else exportToExcel(data, columns, 'projects_report');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-bengali">প্রকল্প ও বিনিয়োগ</h1>
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
                        <button onClick={() => { setEditProjectId(null); setProjectFormData({ name: '', totalInvestment: '', startDate: new Date().toISOString().split('T')[0], status: 'Running' }); setIsProjectModalOpen(true); }} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                            <Plus size={20} /> + New Project
                        </button>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                title={editProjectId ? 'প্রকল্প আপডেট করুন' : 'নতুন প্রকল্প যোগ করুন'}
                maxWidth="max-w-2xl"
            >
                <div className="p-6">
                    <form onSubmit={handleProjectSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">প্রকল্পের নাম</label>
                                <input required type="text" value={projectFormData.name} onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">মোট বিনিয়োগ (৳)</label>
                                <input required type="number" min="1" value={projectFormData.totalInvestment} onChange={(e) => setProjectFormData({ ...projectFormData, totalInvestment: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            <div>
                                <label className="block text-base font-medium text-gray-700 font-bengali">শুরুর তারিখ</label>
                                <input required type="date" value={projectFormData.startDate} onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all" />
                            </div>
                            {editProjectId && (
                                <div>
                                    <label className="block text-base font-medium text-gray-700 font-bengali">স্ট্যাটাস</label>
                                    <select required value={projectFormData.status} onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value })} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 p-3 border text-base transition-all bg-white">
                                        <option value="Running">চলমান</option>
                                        <option value="Completed">সম্পূর্ণ</option>
                                        <option value="Cancelled">বাতিল</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-base font-medium text-gray-700 font-bengali">প্রকল্পের ছবি (ঐচ্ছিক)</label>
                            <div className="mt-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors group cursor-pointer relative overflow-hidden">
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white font-bold font-bengali">ছবি পরিবর্তন করুন</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-2">
                                            <Plus size={32} />
                                        </div>
                                        <p className="text-gray-500 font-bengali">এখানে ক্লিক করে ছবি নির্বাচন করুন</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG বা WEBP (সর্বোচ্চ ৫ মেগাবাইট)</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 font-bengali">
                            <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all">বাতিল</button>
                            <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all">
                                {editProjectId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Revenue Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-2 font-bengali">প্রকল্প থেকে আয় গ্রহণ</h2>
                    <p className="text-sm text-gray-500 mb-1 font-bengali">প্রকল্প: <strong>{selectedProject?.name}</strong></p>
                    <p className="text-xs text-blue-600 bg-blue-50 rounded p-2 mb-4 font-bengali">আয়টি সংগঠনের সামগ্রিক তহবিলে যোগ হবে। পরবর্তীতে সমান অংশে সদস্যদের কাছে বিতরণ করা যাবে।</p>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div><label className="block text-base font-medium text-gray-700 font-bengali">আয়ের পরিমাণ (৳)</label><input required type="number" min="1" value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-base" /></div>
                        <div><label className="block text-base font-medium text-gray-700 font-bengali">তারিখ</label><input required type="date" value={paymentFormData.date} onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-base" /></div>
                        <div><label className="block text-base font-medium text-gray-700 font-bengali">নোট</label><textarea value={paymentFormData.note} onChange={(e) => setPaymentFormData({ ...paymentFormData, note: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-base" rows="2" placeholder="ঐচ্ছিক"></textarea></div>
                        <div className="flex justify-end gap-3 mt-6 font-bengali">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-hindi">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-hindi">Save</button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmModal isOpen={deleteProjectModal.isOpen} onClose={() => setDeleteProjectModal({ isOpen: false, id: null })} onConfirm={handleDeleteProject} title="প্রকল্প মুছে ফেলুন" message="আপনি কি নিশ্চিত যে এই প্রকল্পটি মুছে ফেলতে চান? যদি প্রকল্প থেকে কোনো আয় গ্রহণ করা হয়ে থাকে, তবে প্রকল্পটি মোছা যাবে না।" confirmText="Yes, Delete" />

            {loading ? (
                <div className="text-center text-gray-500 py-8 font-bengali">লোড হচ্ছে...</div>
            ) : projects.length === 0 ? (
                <div className="text-center text-gray-500 py-8 font-bengali">কোনো প্রকল্পের তথ্য পাওয়া যায়নি</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => {
                        const totalReceived = project.paymentsReceived.reduce((acc, curr) => acc + curr.amount, 0);
                        const progressPercentage = Math.min((totalReceived / project.totalInvestment) * 100, 100);
                        const isHistoryOpen = expandedHistory[project._id];
                        const sortedPayments = [...(project.paymentsReceived || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

                        return (
                            <div key={project._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-primary-100 transition-all duration-300 transform hover:-translate-y-1">
                                {/* Project Image */}
                                <div className="h-48 w-full relative overflow-hidden bg-gray-100">
                                    {project.image ? (
                                        <img src={`${FILE_BASE_URL}${project.image}`} alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                            <DollarSign size={48} className="mb-2" />
                                            <span className="text-xs font-bengali opacity-50">ছবি নেই</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm font-bengali ${project.status === 'Running' ? 'bg-blue-500 text-white' : project.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                            {project.status === 'Running' ? 'চলমান' : project.status === 'Completed' ? 'সম্পূর্ণ' : 'বাতিল'}
                                        </span>
                                    </div>
                                    {user?.role === 'Admin' && (
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditProject(project)} className="bg-white/90 backdrop-blur p-2 rounded-lg text-indigo-600 hover:bg-white shadow-sm transition-all" title="Edit"><Edit2 size={16} /></button>
                                            <button onClick={() => setDeleteProjectModal({ isOpen: true, id: project._id })} className="bg-white/90 backdrop-blur p-2 rounded-lg text-red-600 hover:bg-white shadow-sm transition-all" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex-1">
                                    <h3 className="text-xl text-gray-900 font-extrabold leading-tight font-bengali mb-4 group-hover:text-primary-600 transition-colors uppercase">{project.name}</h3>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-bengali">বিনিয়োগ</p>
                                            <p className="text-base font-black text-gray-900">৳{project.totalInvestment.toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-bengali">মোট আয়</p>
                                            <p className="text-base font-black text-green-600">৳{totalReceived.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Profit Card */}
                                    <div className={`p-4 rounded-xl border ${project.currentProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} mb-4`}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-500 font-bengali">সামগ্রিক লাভ/ক্ষতি:</span>
                                            <span className={`font-black text-xl ${project.currentProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {project.currentProfit > 0 ? '+' : ''}{project.currentProfit.toLocaleString()}৳
                                            </span>
                                        </div>
                                    </div>

                                    {/* Audit Info */}
                                    <div className="flex justify-between items-center px-1 mb-6 text-[10px] text-gray-400 font-bengali border-t border-gray-50 pt-2">
                                        <div>
                                            <span>তৈরি: {project.createdBy?.name || 'Admin'} ({new Date(project.createdAt).toLocaleDateString('bn-BD')})</span>
                                        </div>
                                        {project.updatedBy && (
                                            <div className="text-blue-400 font-medium">
                                                আপডেট: {project.updatedBy?.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-400 font-bengali">বিনিয়োগ ফেরত</span>
                                            <span className="text-xs font-black text-primary-600">{progressPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="overflow-hidden h-2.5 rounded-full bg-gray-100">
                                            <div style={{ width: `${progressPercentage}%` }} className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1000 rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* History Toggle Sections */}
                                {(sortedPayments.length > 0 || (project.investmentHistory && project.investmentHistory.length > 0)) && (
                                    <div className="border-t border-gray-100">
                                        {/* Revenue History Toggle */}
                                        {sortedPayments.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => toggleHistory(`${project._id}_revenue`)}
                                                    className="w-full flex items-center justify-between px-5 py-3 text-base text-gray-600 hover:bg-gray-50 transition-colors font-bengali border-b border-gray-50"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <History size={18} className="text-gray-400" />
                                                        আয়ের ইতিহাস ({sortedPayments.length}টি)
                                                    </span>
                                                    {expandedHistory[`${project._id}_revenue`] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>

                                                {expandedHistory[`${project._id}_revenue`] && (
                                                    <div className="bg-gray-50 px-5 pb-3 space-y-2 max-h-48 overflow-y-auto">
                                                        {sortedPayments.map((payment, idx) => (
                                                            <div key={idx} className="flex justify-between items-start text-sm py-2 border-b border-gray-200 last:border-0">
                                                                <div className="font-bengali text-gray-600">
                                                                    <p className="font-medium text-gray-800">{new Date(payment.date).toLocaleDateString('bn-BD')}</p>
                                                                    {payment.note && <p className="text-gray-500 mt-1">{payment.note}</p>}
                                                                </div>
                                                                <span className="font-bold text-green-600 ml-3 whitespace-nowrap">+{payment.amount.toLocaleString()}৳</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Investment History Toggle */}
                                        {project.investmentHistory && project.investmentHistory.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => toggleHistory(`${project._id}_investment`)}
                                                    className="w-full flex items-center justify-between px-5 py-3 text-base text-gray-600 hover:bg-gray-50 transition-colors font-bengali"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Plus size={18} className="text-gray-400" />
                                                        বিনিয়োগের ইতিহাস ({project.investmentHistory.length}টি)
                                                    </span>
                                                    {expandedHistory[`${project._id}_investment`] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>

                                                {expandedHistory[`${project._id}_investment`] && (
                                                    <div className="bg-purple-50/30 px-5 pb-3 space-y-2 max-h-48 overflow-y-auto">
                                                        {project.investmentHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv, idx) => (
                                                            <div key={idx} className="flex justify-between items-start text-sm py-2 border-b border-purple-100 last:border-0">
                                                                <div className="font-bengali text-gray-600">
                                                                    <p className="font-medium text-gray-800">{new Date(inv.date).toLocaleDateString('bn-BD')}</p>
                                                                    {inv.note && <p className="text-gray-500 mt-1">{inv.note}</p>}
                                                                </div>
                                                                <span className="font-bold text-purple-600 ml-3 whitespace-nowrap">-{inv.amount.toLocaleString()}৳</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-2">
                                    {user?.role === 'Admin' && project.status === 'Running' && (
                                        <button
                                            onClick={() => { setSelectedProject(project); setIsPaymentModalOpen(true); }}
                                            className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors font-bengali"
                                        >
                                            <DollarSign size={15} /> Receive Revenue
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default Projects;
