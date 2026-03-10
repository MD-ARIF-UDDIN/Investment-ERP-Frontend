import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 font-bengali overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setIsOpen={setIsSidebarOpen} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col">
                    <div className="flex-1">
                        <Outlet />
                    </div>

                    <footer className="mt-8 pt-6 border-t border-gray-200 text-center pb-2">
                        <p className="text-[11px] text-gray-400 font-medium font-bengali">
                            © {new Date().getFullYear()} স্বপ্নের বাতিঘর। All rights reserved.
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">
                            Developed by: <span className="text-primary-600 font-bold">Md Arif Uddin</span>, Software Engineer. Contact: <span className="text-primary-600 font-bold tracking-wider">01825334505</span>
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
