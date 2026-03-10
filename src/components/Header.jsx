import React, { useContext } from 'react';
import { Menu, User, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Header = ({ setIsOpen }) => {
    const { user } = useContext(AuthContext);

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
            <div className="flex items-center">
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="text-gray-500 hover:text-primary-600 focus:outline-none md:hidden p-2 rounded-xl hover:bg-primary-50 transition-all active:scale-95"
                >
                    <Menu size={24} />
                </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {user && (
                    <div className="flex items-center gap-2 group cursor-pointer p-0.5 sm:p-1 pr-2 sm:pr-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-200 ring-2 ring-white">
                            {user.photo ? (
                                <img src={user.photo} alt={user.name} className="h-full w-full object-cover rounded-xl" />
                            ) : (
                                <User size={20} className="text-white" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-[12px] sm:text-sm font-black text-gray-900 font-bengali leading-none mb-0.5 whitespace-nowrap">{user.name}</p>
                            <p className="text-[8px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-400 font-bengali leading-none">{user.role}</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors hidden sm:block" />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
