import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Download, PieChart, Activity, ChevronLeft, ChevronRight, FileSpreadsheet, FileText as FilePdf, Filter, Calendar } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Reports = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'profit', 'ledger', or 'project'
    const { user } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();

    // Data States
    const [projects, setProjects] = useState([]);
    const [members, setMembers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Profit Filter States
    const [profitData, setProfitData] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        sharePerMember: 0,
        memberCount: 0,
        projectBreakdown: [],
        expenseBreakdown: []
    });
    const [filterType, setFilterType] = useState('month'); // 'month', 'year', 'custom'
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [projectReport, setProjectReport] = useState([]);

    const fetchLogs = async (page = 1) => {
        if (user?.role !== 'Admin') return;
        try {
            setLoading(true);
            const { data } = await api.get(`/logs?page=${page}&limit=50`);
            setLogs(data.logs);
            setPagination({ page: data.page, pages: data.pages, total: data.total });
        } catch {
            toast.error('অডিট লগ লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfitData = async () => {
        if (user?.role !== 'Admin') return;
        try {
            setLoading(true);
            let url = '/reports/profit?';
            if (filterType === 'month') {
                url += `month=${selectedMonth}&year=${selectedYear}`;
            } else if (filterType === 'year') {
                url += `year=${selectedYear}`;
            } else if (filterType === 'custom') {
                url += `startDate=${startDate}&endDate=${endDate}`;
            }

            const { data } = await api.get(url);
            setProfitData(data);

            // Also fetch basic members for context if needed, but endpoint provides count
            const membRes = await api.get('/members');
            setMembers(membRes.data.filter(m => m.status === 'Active'));
        } catch (error) {
            toast.error('লভ্যাংশের তথ্য লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedgerData = async () => {
        if (user?.role !== 'Admin') return;
        try {
            setLoading(true);
            const { data } = await api.get('/members');
            setMembers(data);
            // Also fetch profit data to show "Expected Profit" in ledger
            await fetchProfitData();
        } catch (error) {
            toast.error('লেজার তথ্য লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectReport = async () => {
        if (user?.role !== 'Admin') return;
        try {
            setLoading(true);
            let url = `/reports/projects?type=${filterType}&month=${selectedMonth}&year=${selectedYear}`;
            if (filterType === 'custom' && startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const { data } = await api.get(url);
            setProjectReport(data);
        } catch (error) {
            toast.error('প্রকল্প রিপোর্টের তথ্য লোড করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit') fetchLogs();
        else if (activeTab === 'profit') fetchProfitData();
        else if (activeTab === 'ledger') fetchLedgerData();
        else if (activeTab === 'project') fetchProjectReport();
    }, [user, activeTab, selectedMonth, selectedYear, filterType, startDate, endDate]);

    const getActionText = (action) => {
        const actions = {
            'CREATE_MEMBER': 'সদস্য যোগ',
            'UPDATE_MEMBER': 'সদস্য আপডেট',
            'DELETE_MEMBER': 'সদস্য মুছে ফেলা',
            'CREATE_DEPOSIT': 'জমা গ্রহণ',
            'UPDATE_DEPOSIT': 'জমা আপডেট',
            'DELETE_DEPOSIT': 'জমা মুছে ফেলা',
            'CREATE_WITHDRAWAL': 'উত্তোলন অনুমোদন',
            'UPDATE_WITHDRAWAL': 'উত্তোলন আপডেট',
            'DELETE_WITHDRAWAL': 'উত্তোলন মুছে ফেলা',
            'CREATE_PROJECT': 'প্রকল্প তৈরি',
            'UPDATE_PROJECT': 'প্রকল্প আপডেট',
            'DELETE_PROJECT': 'প্রকল্প মুছে ফেলা',
            'ADD_PROJECT_PAYMENT': 'প্রকল্প আয় গ্রহণ',
            'CREATE_EXPENSE': 'খরচ যোগ',
            'UPDATE_EXPENSE': 'খরচ আপডেট',
            'DELETE_EXPENSE': 'খরচ মুছে ফেলা',
            'DISTRIBUTE_PROFIT': 'লভ্যাংশ বণ্টন',
        };
        return actions[action] || action;
    };

    const totalUndistributedProfit = projects.reduce((acc, p) => {
        const undistributed = (p.currentProfit || 0) - (p.distributedProfit || 0);
        return acc + (undistributed > 0 ? undistributed : 0);
    }, 0);

    const sharePerMember = members.length > 0 ? totalUndistributedProfit / members.length : 0;

    const exportLogs = async (type) => {
        try {
            showLoading();
            const columns = [
                { header: 'তারিখ ও সময়', dataKey: 'date' },
                { header: 'ব্যবহারকারী', dataKey: 'userName' },
                { header: 'অ্যাকশন', dataKey: 'actionText' },
                { header: 'বিস্তারিত', dataKey: 'details' }
            ];

            const data = logs.map(log => ({
                date: new Date(log.timestamp).toLocaleString('bn-BD'),
                userName: log.user?.name || 'Unknown',
                actionText: getActionText(log.action),
                details: `${log.entityType}: ${log.entityId}`
            }));

            if (type === 'pdf') await exportToPDF(data, columns, 'audit_logs', 'Audit Logs Report');
            else await exportToExcel(data, columns, 'audit_logs');
        } catch (error) {
            toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const exportProfit = async (type) => {
        try {
            showLoading();
            const columns = [
                { header: 'সদস্য আইডি', dataKey: 'memberId' },
                { header: 'নাম', dataKey: 'name' },
                { header: 'বর্তমান মোট জমা', dataKey: 'current' },
                { header: 'সীমার মধ্যে জমা', dataKey: 'rangeDeposit' },
                { header: 'প্রাপ্য লভ্যাংশ', dataKey: 'profit' },
                { header: 'মোট জমা', dataKey: 'total' }
            ];

            const activeMembers = members.filter(m => m.status === 'Active');
            const data = activeMembers.map(m => ({
                memberId: m.memberId,
                name: m.name,
                current: `${m.totalDeposit}৳`,
                rangeDeposit: `${(profitData.memberRangeDeposits?.[m._id] || 0).toLocaleString()}৳`,
                profit: `${profitData.sharePerMember.toFixed(2)}৳`,
                total: `${(m.totalDeposit + profitData.sharePerMember).toFixed(2)}৳`
            }));

            if (type === 'pdf') await exportToPDF(data, columns, 'profit_distribution', 'Profit Distribution Preview');
            else await exportToExcel(data, columns, 'profit_distribution');
        } catch (error) {
            toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const exportLedger = async (type) => {
        try {
            showLoading();
            const columns = [
                { header: 'সদস্য আইডি', dataKey: 'memberId' },
                { header: 'নাম', dataKey: 'name' },
                { header: 'মোট জমা', dataKey: 'deposit' },
                { header: 'মোট উত্তোলন', dataKey: 'withdrawal' },
                { header: 'বন্টিত লাভ (মোট)', dataKey: 'distributedProfit' },
                { header: 'উত্তোলনকৃত লাভ', dataKey: 'withdrawnProfit' },
                { header: 'অবশিষ্ট লাভ', dataKey: 'availableProfit' },
                { header: 'নিট ব্যালেন্স', dataKey: 'balance' }
            ];

            const data = members.map(m => ({
                memberId: m.memberId,
                name: m.name,
                deposit: `${m.totalDeposit || 0}৳`,
                withdrawal: `${m.totalWithdrawal || 0}৳`,
                distributedProfit: `${m.totalProfitShare || 0}৳`,
                withdrawnProfit: `${m.withdrawnProfit || 0}৳`,
                availableProfit: `${(m.totalProfitShare || 0) - (m.withdrawnProfit || 0)}৳`,
                balance: `${((m.totalDeposit || 0) + (m.totalProfitShare || 0) - (m.totalWithdrawal || 0)).toLocaleString()}৳`
            }));

            if (type === 'pdf') await exportToPDF(data, columns, 'member_ledger', 'Member Net Ledger Report');
            else await exportToExcel(data, columns, 'member_ledger');
        } catch (error) {
            toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    const exportProjectReport = async (type) => {
        try {
            showLoading();
            const columns = [
                { header: 'প্রকল্পের নাম', dataKey: 'name' },
                { header: 'বিনিয়োগ', dataKey: 'investment' },
                { header: 'মোট আয়', dataKey: 'revenue' },
                { header: 'মোট লাভ', dataKey: 'profit' },
                { header: 'অবস্থা', dataKey: 'status' }
            ];

            const data = projectReport.map(p => ({
                name: p.name,
                investment: `${p.totalInvestment}৳`,
                revenue: `${p.totalRevenue}৳`,
                profit: `${p.totalProfit}৳`,
                status: p.status === 'Running' ? 'চলমান' : (p.status === 'Completed' ? 'সম্পন্ন' : 'বাতিল')
            }));

            if (type === 'pdf') await exportToPDF(data, columns, 'project_report', 'Project wise Profit/Loss Report');
            else await exportToExcel(data, columns, 'project_report');
        } catch (error) {
            toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে');
        } finally {
            hideLoading();
        }
    };

    if (user?.role !== 'Admin') {
        return <div className="p-8 text-center text-red-600 font-bold font-bengali">এই পেজে আপনার প্রবেশাধিকার নেই।</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-bengali">রিপোর্ট এবং এনালিটিক্স</h1>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 rounded-md font-bengali transition-colors ${activeTab === 'audit' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        অডিট লগ
                    </button>
                    <button
                        onClick={() => setActiveTab('profit')}
                        className={`px-4 py-2 rounded-md font-bengali transition-colors ${activeTab === 'profit' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        লভ্যাংশ রিপোর্ট
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-4 py-2 rounded-md font-bengali transition-colors ${activeTab === 'ledger' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        সদস্য লেজার
                    </button>
                    <button
                        onClick={() => setActiveTab('project')}
                        className={`px-4 py-2 rounded-md font-bengali transition-colors ${activeTab === 'project' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        প্রকল্প রিপোর্ট
                    </button>
                </div>
            </div>

            {activeTab === 'audit' && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-700 font-bengali">সিস্টেম অ্যাক্টিভিটি লগ (সর্বশেষ)</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportLogs('excel')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors font-bengali"
                            >
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button
                                onClick={() => exportLogs('pdf')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors font-bengali"
                            >
                                <FilePdf size={16} /> PDF
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 font-bengali">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">সময় ও তারিখ</th>
                                        <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">ব্যবহারকারী</th>
                                        <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">অ্যাকশন</th>
                                        <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">বিস্তারিত</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 font-bengali text-sm text-gray-700 font-medium">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 font-bengali">
                                            <td className="px-6 py-4 whitespace-nowrap text-base">
                                                {new Date(log.timestamp).toLocaleString('bn-BD')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 border-l border-gray-100">
                                                {log.user?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border-l border-gray-100">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {getActionText(log.action)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-base max-w-md truncate border-l border-gray-100">
                                                {log.entityType}: {log.entityId}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">কোনো লগ তথ্য পাওয়া যায়নি</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && pagination.pages > 1 && (
                        <div className="p-4 border-t bg-gray-50 flex justify-between items-center font-bengali">
                            <p className="text-sm text-gray-600">
                                মোট <strong>{pagination.total}</strong>টি লগের মধ্যে <strong>{(pagination.page - 1) * 50 + 1}</strong> - <strong>{Math.min(pagination.page * 50, pagination.total)}</strong> দেখানো হচ্ছে
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchLogs(pagination.page - 1)}
                                    className={`p-2 rounded-md border ${pagination.page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="flex items-center px-3 py-1 bg-white border rounded-md text-sm font-bold">
                                    {pagination.page} / {pagination.pages}
                                </span>
                                <button
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => fetchLogs(pagination.page + 1)}
                                    className={`p-2 rounded-md border ${pagination.page === pagination.pages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'profit' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border rounded-md px-2 py-1 text-sm font-bengali"
                            >
                                <option value="month">মাসিক</option>
                                <option value="year">বার্ষিক</option>
                                <option value="custom">কাস্টম রেঞ্জ</option>
                            </select>
                        </div>

                        {filterType === 'month' && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-sm font-bengali"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                        <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('bn-BD', { month: 'long' })}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-sm font-bengali"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {filterType === 'year' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="border rounded-md px-2 py-1 text-sm font-bengali"
                            >
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}

                        {filterType === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-sm"
                                />
                                <span className="text-gray-400">থেকে</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500 font-bengali">মোট নিট লাভ (সব প্রকল্প ও খরচ)</p>
                            <p className="text-2xl font-bold text-blue-600 font-bengali">{profitData.netProfit.toLocaleString()}৳</p>
                            <div className="mt-2 text-[10px] text-gray-400 font-bengali">
                                আয়: {profitData.totalRevenue.toLocaleString()}৳ | ব্যয়: {profitData.totalExpenses.toLocaleString()}৳
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
                            <p className="text-sm text-gray-500 font-bengali">সক্রিয় সদস্য সংখ্যা</p>
                            <p className="text-2xl font-bold text-indigo-600 font-bengali">{profitData.memberCount} জন</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                            <p className="text-sm text-gray-500 font-bengali">সদস্য প্রতি প্রাপ্য লভ্যাংশ</p>
                            <p className="text-2xl font-bold text-green-600 font-bengali">{profitData.sharePerMember.toFixed(2)}৳</p>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-700 font-bengali">সদস্যদের লভ্যাংশ রিপোর্ট</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => exportProfit('excel')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                                >
                                    <FileSpreadsheet size={20} /> Excel
                                </button>
                                <button
                                    onClick={() => exportProfit('pdf')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-bengali"
                                >
                                    <FilePdf size={20} /> PDF
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500 font-bengali">লোড হচ্ছে...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 font-bengali">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">সদস্য আইডি</th>
                                            <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">নাম</th>
                                            <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider">বর্তমান মোট জমা</th>
                                            <th className="px-6 py-4 text-left text-base font-bold text-indigo-600 tracking-wider">নির্ধারিত সীমার জমা</th>
                                            <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider text-green-600">প্রাপ্য লভ্যাংশ</th>
                                            <th className="px-6 py-4 text-left text-base font-bold text-gray-700 tracking-wider text-blue-600">সম্ভাব্য মোট জমা</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                        {members.map((member) => (
                                            <tr key={member._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">{member.memberId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 border-l border-gray-100">{member.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 border-l border-gray-100">{member.totalDeposit?.toLocaleString()}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-600 border-l border-gray-100">{(profitData.memberRangeDeposits?.[member._id] || 0).toLocaleString()}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-green-600 border-l border-gray-100">+{profitData.sharePerMember.toFixed(2)}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-blue-600 border-l border-gray-100">{(member.totalDeposit + profitData.sharePerMember).toLocaleString()}৳</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'ledger' && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-[2rem] overflow-hidden border border-gray-100">
                        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 font-bengali">সদস্য ফাইনানশিয়াল লেজার</h2>
                                <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Full Member Transaction Ledger</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => exportLedger('excel')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bengali shadow-lg shadow-green-100 active:scale-95"
                                >
                                    <FileSpreadsheet size={18} /> Excel
                                </button>
                                <button
                                    onClick={() => exportLedger('pdf')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bengali shadow-lg shadow-red-100 active:scale-95"
                                >
                                    <FilePdf size={18} /> PDF
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-16 text-center text-gray-400 font-bengali italic">লোড হচ্ছে...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/50 font-bengali">
                                        <tr>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">সদস্য</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">মোট জমা</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">মোট উত্তোলন</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-green-600 uppercase tracking-widest">বন্টিত লাভ (মোট)</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-orange-600 uppercase tracking-widest">উত্তোলনকৃত লভ্যাংশ</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-blue-600 uppercase tracking-widest">অবশিষ্ট লভ্যাংশ</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-primary-600 uppercase tracking-widest">নিট ব্যালেন্স</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100 font-bengali">
                                        {members.map((member) => (
                                            <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-200 uppercase tracking-tighter">
                                                            {member.memberId}
                                                        </div>
                                                        <div className="text-sm font-black text-gray-900">{member.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                                    {(member.totalDeposit || 0).toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                                    {(member.totalWithdrawal || 0).toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                                    {(member.totalProfitShare || 0).toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                                                    {(member.withdrawnProfit || 0).toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                                                    {((member.totalProfitShare || 0) - (member.withdrawnProfit || 0)).toLocaleString()} ৳
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-black ring-1 ring-primary-100 ring-inset">
                                                        {((member.totalDeposit || 0) + (member.totalProfitShare || 0) - (member.totalWithdrawal || 0)).toLocaleString()} ৳
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-bengali">
                                        <tr>
                                            <td className="px-6 py-5 text-sm font-black text-gray-400 uppercase tracking-widest">সর্বমোট</td>
                                            <td className="px-6 py-5 text-sm font-black text-gray-900 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + (m.totalDeposit || 0), 0).toLocaleString()} ৳
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-red-600 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + (m.totalWithdrawal || 0), 0).toLocaleString()} ৳
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-green-600 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + (m.totalProfitShare || 0), 0).toLocaleString()} ৳
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-orange-600 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + (m.withdrawnProfit || 0), 0).toLocaleString()} ৳
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-blue-600 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + ((m.totalProfitShare || 0) - (m.withdrawnProfit || 0)), 0).toLocaleString()} ৳
                                            </td>
                                            <td className="px-6 py-5 text-sm font-black text-primary-600 border-l border-gray-200">
                                                {members.reduce((sum, m) => sum + ((m.totalDeposit || 0) + (m.totalProfitShare || 0) - (m.totalWithdrawal || 0)), 0).toLocaleString()} ৳
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'project' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="font-semibold text-gray-700 font-bengali">প্রকল্প ভিত্তিক লাভ-ক্ষতি রিপোর্ট</h2>
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-gray-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="border rounded-md px-2 py-1 text-xs font-bengali"
                                >
                                    <option value="all">সব সময়</option>
                                    <option value="month">মাসিক</option>
                                    <option value="year">বার্ষিক</option>
                                    <option value="custom">কাস্টম রেঞ্জ</option>
                                </select>
                            </div>

                            {filterType === 'month' && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-xs font-bengali"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Intl.DateTimeFormat('bn-BD', { month: 'long' }).format(new Date(2000, i, 1))}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-xs font-bengali"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <option key={i} value={new Date().getFullYear() - i}>
                                                {new Date().getFullYear() - i}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {filterType === 'year' && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-xs font-bengali"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <option key={i} value={new Date().getFullYear() - i}>
                                                {new Date().getFullYear() - i}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {filterType === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-xs"
                                    />
                                    <span className="text-gray-400 text-xs">থেকে</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border rounded-md px-2 py-1 text-xs"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportProjectReport('excel')}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors font-bengali"
                            >
                                <FileSpreadsheet size={16} /> Excel
                            </button>
                            <button
                                onClick={() => exportProjectReport('pdf')}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors font-bengali"
                            >
                                <FilePdf size={16} /> PDF
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-16 text-center text-gray-400 font-bengali">লোড হচ্ছে...</div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 font-bengali">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">প্রকল্পের নাম</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">বিনিয়োগ</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">মোট আয়</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">আয় (সীমার মধ্যে)</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">মোট লাভ/ক্ষতি</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 tracking-wider">অবস্থা</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 font-bengali">
                                        {projectReport.map((proj) => (
                                            <tr key={proj._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{proj.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{proj.totalInvestment.toLocaleString()}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">{proj.totalRevenue.toLocaleString()}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{proj.periodRevenue.toLocaleString()}৳</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`font-bold ${proj.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {proj.totalProfit.toLocaleString()}৳
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${proj.status === 'Running' ? 'bg-blue-100 text-blue-800' :
                                                        (proj.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                                        }`}>
                                                        {proj.status === 'Running' ? 'চলমান' : (proj.status === 'Completed' ? 'সম্পন্ন' : 'বাতিল')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 font-bold font-bengali">
                                        <tr>
                                            <td className="px-6 py-4">সর্বমোট</td>
                                            <td className="px-6 py-4">{projectReport.reduce((acc, p) => acc + p.totalInvestment, 0).toLocaleString()}৳</td>
                                            <td className="px-6 py-4 text-green-600">{projectReport.reduce((acc, p) => acc + p.totalRevenue, 0).toLocaleString()}৳</td>
                                            <td className="px-6 py-4 text-blue-600">{projectReport.reduce((acc, p) => acc + p.periodRevenue, 0).toLocaleString()}৳</td>
                                            <td className="px-6 py-4 font-black">
                                                {projectReport.reduce((acc, p) => acc + p.totalProfit, 0).toLocaleString()}৳
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
