import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    Wallet,
    ArrowDownToLine,
    ArrowUpFromLine,
    Briefcase,
    FileText,
    LogOut,
    Menu,
    UserCog,
    Coins
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'ড্যাশবোর্ড', path: '/', icon: <LayoutDashboard size={24} />, roles: ['Admin', 'Member'] },
        { name: 'সদস্যগণ', path: '/members', icon: <Users size={24} />, roles: ['Admin', 'Member'] },
        { name: 'জমা', path: '/deposits', icon: <ArrowDownToLine size={24} />, roles: ['Admin', 'Member'] },
        { name: 'উত্তোলন', path: '/withdrawals', icon: <ArrowUpFromLine size={24} />, roles: ['Admin', 'Member'] },
        { name: 'প্রকল্প / বিনিয়োগ', path: '/projects', icon: <Briefcase size={24} />, roles: ['Admin', 'Member'] },
        { name: 'খরচ', path: '/expenses', icon: <Wallet size={24} />, roles: ['Admin', 'Member'] },
        { name: 'লভ্যাংশ বণ্টন', path: '/distributions', icon: <Coins size={24} />, roles: ['Admin', 'Member'] },
        { name: 'রিপোর্ট', path: '/reports', icon: <FileText size={24} />, roles: ['Admin', 'Member'] },
        { name: 'ব্যবহারকারী', path: '/users', icon: <UserCog size={24} />, roles: ['Admin', 'Member'] },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white/95 backdrop-blur-3xl border-r border-gray-100/80 shadow-[10px_0_30px_rgba(0,0,0,0.03)] transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col h-screen`}>
                
                {/* Logo Section */}
                <div className="flex items-center gap-4 px-6 h-24 min-h-[6rem] border-b border-gray-100/60 bg-gradient-to-br from-white to-gray-50/30">
                    <div className="relative flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-primary-100 to-primary-50 shadow-inner border border-white">
                        <img src="/logo.png" alt="Logo" className="h-9 w-9 object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[1.35rem] leading-tight font-black bg-gradient-to-r from-primary-800 to-primary-500 bg-clip-text text-transparent font-bengali tracking-tight">স্বপ্নের বাতিঘর</h1>
                        <span className="text-[0.65rem] font-bold text-gray-400/80 uppercase tracking-widest mt-0.5">Management System</span>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    <p className="px-4 text-xs font-black text-gray-300/80 uppercase tracking-[0.2em] mb-4 mt-2 font-bengali">মেন্যুসমূহ</p>
                    {navItems.map((item) => {
                        if (user && item.roles.includes(user.role)) {
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `group flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl font-bengali transition-all duration-300 relative overflow-hidden ${isActive
                                            ? 'bg-gradient-to-r from-primary-50/80 to-primary-50/10 text-primary-700 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] ring-1 ring-primary-100/50'
                                            : 'text-gray-500 hover:bg-gray-50/80 hover:text-gray-800 hover:translate-x-1'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {/* Active Marker Line */}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full shadow-[0_0_8px_rgba(var(--primary-custom),0.4)]"></div>
                                            )}
                                            {/* Icon */}
                                            <span className={`mr-4 transition-transform duration-300 ${isActive ? 'scale-110 text-primary-600 drop-shadow-sm' : 'text-gray-400 group-hover:scale-110 group-hover:text-primary-400 group-hover:-rotate-3'}`}>
                                                {item.icon}
                                            </span>
                                            {/* Label */}
                                            <span className="flex-1 whitespace-nowrap z-10">{item.name}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Logout Section */}
                <div className="p-5 border-t border-gray-100/80 bg-gradient-to-b from-white to-gray-50/50 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="group flex items-center justify-center w-full px-4 py-3.5 text-sm font-black text-rose-600 bg-white border border-rose-100/80 rounded-2xl hover:bg-rose-50 hover:border-rose-200 transition-all duration-300 shadow-sm hover:shadow-md font-bengali hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                    >
                        <LogOut size={18} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1 group-hover:scale-110 group-hover:drop-shadow-sm" />
                        লগআউট করুন
                    </button>
                    <div className="mt-5 text-center flex items-center justify-center gap-2 opacity-60">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">System Online</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
