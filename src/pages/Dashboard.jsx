import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    Users,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    PieChart as PieChartIcon,
    Activity,
    Smartphone,
    ArrowRight,
    CheckCircle2,
    Clock,
    Wallet,
    ArrowLeftRight,
    Briefcase,
    ShieldCheck,
    HandCoins,
    BarChart3
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [summary, setSummary] = useState({
        totalMembers: 0,
        totalMemberDeposits: 0,
        totalMemberWithdrawals: 0,
        totalExpenses: 0,
        totalActiveInvestments: 0,
        totalRevenue: 0,
        totalProfitDistributed: 0,
        totalProjectProfit: 0,
        availableBalance: 0,
        projectStats: { running: 0, completed: 0, total: 0 },
        memberStats: { active: 0, inactive: 0, total: 0 },
        totalWithdrawals: 0,
        projectRevenueBreakdown: [],
        depositTypeDistribution: [],
        trends: { deposits: [], expenses: [] }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            if (user?.role !== 'Admin') {
                setLoading(false);
                return;
            }
            try {
                const { data } = await api.get('/reports/summary');
                setSummary(data);
            } catch (error) {
                console.error('Failed to load summary');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [user]);

    const formatTrendData = () => {
        const monthNames = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
        const combined = [];
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const month = d.getMonth() + 1;
            const year = d.getFullYear();

            const dep = summary.trends?.deposits?.find(t => t._id.month === month && t._id.year === year)?.total || 0;
            const exp = summary.trends?.expenses?.find(t => t._id.month === month && t._id.year === year)?.total || 0;

            combined.push({
                month: monthNames[month - 1],
                deposit: dep,
                expense: exp
            });
        }
        return combined;
    };

    const trendData = formatTrendData();

    const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider font-bengali">{title}</p>
                    <h3 className={`text-2xl font-black font-bengali ${colorClass}`}>{value}</h3>
                    {subtitle && <p className="text-xs text-gray-400 font-medium font-bengali">{subtitle}</p>}
                </div>
                <div className={`p-4 rounded-2xl ${colorClass.replace('text-', 'bg-').split(' ')[0]}/10 ${colorClass.split(' ')[0]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    );

    if (user?.role !== 'Admin') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] p-10 text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 space-y-4">
                        <h1 className="text-4xl font-black font-bengali leading-tight tracking-tight">আসসালামু আলাইকুম,<br />{user.name}</h1>
                        <p className="text-primary-100 text-lg font-medium font-bengali max-w-md opacity-90">আপনার স্বপ্নের বাতিঘর পোর্টালে স্বাগতম। আপনার ব্যক্তিগত লেনদেন এবং প্রকল্পের তথ্য দেখতে বাম পাশের মেনু ব্যবহার করুন।</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bengali">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">যেকোনো প্রশ্ন?</p>
                            <h4 className="text-xl font-black text-gray-900">সহযোগিতার জন্য এডমিনের সাথে যোগাযোগ করুন</h4>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Header with Title & Cash Balance */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100 font-bengali">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">সারসংক্ষেপ ড্যাশবোর্ড</h1>
                    <p className="text-gray-500 font-medium">আপনার সমবায়ের আর্থিক এবং প্রকল্পের বর্তমান অবস্থা এখানে দেখুন</p>
                </div>

                <div className="bg-gray-950 p-6 rounded-[2rem] flex items-center gap-8 shadow-2xl shadow-gray-200 min-w-[320px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="bg-primary-600 p-4 rounded-2xl shadow-lg relative z-10">
                        <Activity size={24} className="text-white" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">বর্তমান নগদ তহবিল</p>
                        <h3 className="text-3xl font-black text-white">{summary.availableBalance.toLocaleString()} ৳</h3>
                    </div>
                </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-bengali">
                <StatCard
                    title="মোট সদস্য"
                    value={summary.memberStats.total}
                    icon={Users}
                    colorClass="text-blue-600"
                    subtitle={`${summary.memberStats.active} সক্রিয় • ${summary.memberStats.inactive} নিষ্ক্রীয়`}
                />
                <StatCard
                    title="সর্বমোট জমা"
                    value={`${summary.totalMemberDeposits.toLocaleString()} ৳`}
                    icon={ArrowDownRight}
                    colorClass="text-green-600"
                />
                <StatCard
                    title="মোট প্রকল্প আয়"
                    value={`${summary.totalRevenue.toLocaleString()} ৳`}
                    icon={ShieldCheck}
                    colorClass="text-indigo-600"
                    subtitle="বিভিন্ন প্রকল্প থেকে মোট সংগৃহীত"
                />
                <StatCard
                    title="মোট খরচ"
                    value={`${summary.totalExpenses.toLocaleString()} ৳`}
                    icon={Wallet}
                    colorClass="text-pink-600"
                />
                <StatCard
                    title="চলমান বিনিয়োগ"
                    value={`${summary.totalActiveInvestments.toLocaleString()} ৳`}
                    icon={Briefcase}
                    colorClass="text-purple-600"
                    subtitle={`${summary.projectStats.running}টি প্রকল্প বর্তমানে চলমান`}
                />
                <StatCard
                    title="মোট অর্জিত মুনাফা"
                    value={`${summary.totalProjectProfit.toLocaleString()} ৳`}
                    icon={TrendingUp}
                    colorClass="text-emerald-600"
                    subtitle="প্রকল্প থেকে অর্জিত মোট লাভ"
                />
                <StatCard
                    title="মোট উত্তোলন"
                    value={`${summary.totalWithdrawals.toLocaleString()} ৳`}
                    icon={HandCoins}
                    colorClass="text-orange-600"
                    subtitle="সদস্যদের প্রদান করা হয়েছে"
                />
                <StatCard
                    title="সফল প্রকল্প"
                    value={summary.projectStats.completed}
                    icon={CheckCircle2}
                    colorClass="text-cyan-600"
                    subtitle="সম্পূর্ণ হওয়া লাভজনক প্রকল্প"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 font-bengali flex items-center gap-3">
                                <Activity className="text-primary-600" size={24} />
                                অর্থনৈতিক গতিপথ
                            </h3>
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Transaction Trends (Last 6 Months)</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">জমা</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-200"></div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">খরচ</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-80 w-full font-sans">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '1.5rem',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '1.5rem',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <Bar dataKey="deposit" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" fill="#e0e7ff" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-gray-900 font-bengali flex items-center gap-3">
                            <PieChartIcon className="text-orange-600" size={24} />
                            জমার অনুপাত
                        </h3>
                        <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Deposit Type Distribution</p>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary.depositTypeDistribution.map(d => ({
                                        name: d._id === 'Monthly' ? 'মাসিক' : d._id === 'One-time' ? 'এককালীন' : d._id === 'Income' ? 'প্রকল্প আয়' : d._id === 'Profit' ? 'প্রকল্প লাভ' : d._id,
                                        value: d.total
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {[
                                        { color: '#2563eb' },
                                        { color: '#818cf8' },
                                        { color: '#fb923c' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 space-y-3">
                        {summary.depositTypeDistribution.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-sm font-bengali">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${d._id === 'Monthly' ? 'bg-blue-600' : d._id === 'One-time' ? 'bg-indigo-400' : 'bg-orange-400'}`}></div>
                                    <span className="text-gray-600">{d._id === 'Monthly' ? 'মাসিক জমা' : d._id === 'One-time' ? 'এককালীন জমা' : d._id === 'Income' ? 'প্রকল্প আয়' : d._id === 'Profit' ? 'প্রকল্প লাভ' : d._id}</span>
                                </div>
                                <span className="font-bold text-gray-900">{d.total.toLocaleString()} ৳</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue breakdown list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Activity className="text-primary-400" size={24} />
                        </div>
                        <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">সক্রিয় প্রজেক্ট ইনভেস্টমেন্ট</h4>
                        <p className="text-3xl font-black text-white tracking-tighter">৳{summary.totalActiveInvestments.toLocaleString()}</p>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-gray-900 font-bengali flex items-center gap-2">
                            <BarChart3 className="text-indigo-600" size={20} />
                            প্রকল্প ভিত্তিক আয় (Revenue)
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {summary.projectRevenueBreakdown.slice(0, 3).map((p, i) => (
                            <div key={i} className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
                                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 truncate font-bengali">{p.name}</h5>
                                <div className="flex justify-between items-end">
                                    <div className="text-xl font-bold text-gray-900">{p.revenue.toLocaleString()} ৳</div>
                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.revenue >= p.investment ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.investment > 0 ? Math.round((p.revenue / p.investment) * 100) : 0}% ROI
                                    </div>
                                </div>
                            </div>
                        ))}
                        {summary.projectRevenueBreakdown.length > 3 && (
                            <div className="p-4 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                                + {summary.projectRevenueBreakdown.length - 3} More Projects
                            </div>
                        )}
                        {summary.projectRevenueBreakdown.length === 0 && (
                            <div className="col-span-3 py-6 text-center text-gray-400 italic text-sm font-bengali">কোনো প্রকল্প আয় পাওয়া যায়নি</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
