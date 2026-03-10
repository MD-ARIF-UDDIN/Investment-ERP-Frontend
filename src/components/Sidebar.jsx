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
        { name: 'সদস্যগণ', path: '/members', icon: <Users size={24} />, roles: ['Admin'] },
        { name: 'জমা', path: '/deposits', icon: <ArrowDownToLine size={24} />, roles: ['Admin', 'Member'] },
        { name: 'উত্তোলন', path: '/withdrawals', icon: <ArrowUpFromLine size={24} />, roles: ['Admin', 'Member'] },
        { name: 'প্রকল্প / বিনিয়োগ', path: '/projects', icon: <Briefcase size={24} />, roles: ['Admin', 'Member'] },
        { name: 'খরচ', path: '/expenses', icon: <Wallet size={24} />, roles: ['Admin'] },
        { name: 'লভ্যাংশ বণ্টন', path: '/distributions', icon: <Coins size={24} />, roles: ['Admin'] },
        { name: 'রিপোর্ট', path: '/reports', icon: <FileText size={24} />, roles: ['Admin'] },
        { name: 'ব্যবহারকারী', path: '/users', icon: <UserCog size={24} />, roles: ['Admin'] },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center gap-3 h-16 border-b border-gray-200 px-4">
                    <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                    <h1 className="text-xl font-bold text-primary-600 font-bengali">স্বপ্নের বাতিঘর</h1>
                </div>

                <div className="flex flex-col h-[calc(100vh-4rem)] justify-between">
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            if (user && item.roles.includes(user.role)) {
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        onClick={() => setIsOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center px-4 py-3 text-base font-medium rounded-lg font-bengali transition-colors ${isActive
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`
                                        }
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {item.name}
                                    </NavLink>
                                );
                            }
                            return null;
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors font-bengali"
                        >
                            <LogOut size={20} className="mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
