import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const { showLoading, hideLoading } = useLoading();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            showLoading();
            setLoading(true);

            const result = await login(email, password);

            if (result.success) {
                toast.success('সফলভাবে লগইন হয়েছে', {
                    style: { fontFamily: '"Hind Siliguri", sans-serif' },
                });
                navigate('/');
            } else {
                toast.error(result.message, {
                    style: { fontFamily: '"Hind Siliguri", sans-serif' },
                });
            }
        } catch (error) {
            toast.error('লগইন করতে সমস্যা হয়েছে');
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden font-bengali">
            {/* Background Image/Overlay */}
            <div className="absolute inset-0 z-0">
                <img src="/login-bg.png" alt="background" className="w-full h-full object-cover opacity-20 filter blur-sm scale-105" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-primary-50/50"></div>
            </div>

            {/* Floating Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-100/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-lg z-10 px-4">
                <div className="bg-white/70 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/50 relative overflow-hidden group">
                    {/* Top Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 bg-[length:200%_auto] animate-gradient-x"></div>

                    <div className="text-center mb-10">
                        <div className="inline-block p-4 rounded-3xl bg-white shadow-xl shadow-primary-100/50 mb-6 transform group-hover:scale-110 transition-transform duration-500">
                            <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            স্বপ্নের বাতিঘর
                        </h2>
                        <p className="text-gray-500 font-medium">লগইন সেশন শুরু করুন</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">ইমেইল এড্রেস</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-primary-500 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-lg transition-all duration-300 placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">পাসওয়ার্ড</label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within/input:text-primary-500 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-lg transition-all duration-300 placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group/btn flex items-center justify-center py-4 px-6 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold text-lg shadow-xl shadow-primary-200 hover:shadow-primary-300 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                {loading ? (
                                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>লগইন করুন</span>
                                        <ArrowRight className="ml-2 group-hover/btn:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-10 text-center space-y-2">
                        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">
                            Management System v1.0
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                            Developed by: <span className="text-gray-500 font-bold text-[11px]">Md Arif Uddin</span>, Software Engineer. Contact: <span className="text-gray-500 font-bold">01825334505</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
