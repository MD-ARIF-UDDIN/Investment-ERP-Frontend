import React, { useContext } from 'react';
import { Menu } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Header = ({ setIsOpen }) => {
    const { user } = useContext(AuthContext);

    return (
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
            <div className="flex items-center">
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden p-2 rounded-md hover:bg-gray-100"
                >
                    <Menu size={24} />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-900 font-bengali">{user.name}</p>
                            <p className="text-xs text-gray-500 font-bengali">{user.role}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-primary-200">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
