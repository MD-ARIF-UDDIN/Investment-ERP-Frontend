import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { LogIn } from 'lucide-react';
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-bengali">
            <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center mb-8">
                    <div className="mx-auto h-24 w-24 mb-4">
                        <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900">
                        স্বপ্নের বাতিঘর
                    </h2>
                    <p className="mt-2 text-base text-gray-600">
                        আপনার অ্যাকাউন্টে লগইন করুন
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-base font-medium text-gray-700">
                            ইমেইল এড্রেস
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-700">
                            পাসওয়ার্ড
                        </label>
                        <div className="mt-1">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-base"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? (
                                <span className="animate-spin mr-2">⏳</span>
                            ) : null}
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
