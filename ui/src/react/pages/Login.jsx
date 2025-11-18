// Login.jsx
// Enhanced login page with Google Sign-In and Remember Me checkbox

import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle regular login
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        const result = await login(email, password, rememberMe);

        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            setErrors({submit: result.error});
        }

        setIsSubmitting(false);
    };

    // Handle Google Sign-In - redirects to backend OAuth endpoint
    const handleGoogleSignIn = () => {
        // Redirect to backend Google OAuth endpoint
        // The backend will redirect to Google, then back to /auth/google/callback
        window.location.href = 'http://localhost:8000/auth/google/login';
    };

    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6 text-center">Login to Pet Gallery</h1>

            <div className="panel max-w-md mx-auto">
                <form onSubmit={handleSubmit}>
                    {/* Overall submission error */}
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                            {errors.submit}
                        </div>
                    )}

                    {/* Email field */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) {
                                    setErrors({...errors, email: undefined});
                                }
                            }}
                            disabled={isSubmitting}
                            placeholder="your@email.com"
                        />
                        {errors.email && (
                            <div className="text-red-400 text-sm mt-1">
                                {errors.email}
                            </div>
                        )}
                    </div>

                    {/* Password field */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Password</label>
                        <input
                            type="password"
                            className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) {
                                    setErrors({...errors, password: undefined});
                                }
                            }}
                            disabled={isSubmitting}
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        />
                        {errors.password && (
                            <div className="text-red-400 text-sm mt-1">
                                {errors.password}
                            </div>
                        )}
                    </div>

                    {/* Remember Me & Forgot Password row */}
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-[#3a5a86] bg-[#143058] text-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:ring-offset-0"
                                disabled={isSubmitting}
                            />
                            <span className="ml-2 text-sm">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-sm text-[#64FFDA] hover:underline">
                            Forgot password?
                        </Link>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="btn w-full mb-4"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#1b355e]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#112240] text-[#B6C6DA]">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign-In button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </button>

                    {/* Link to registration */}
                    <div className="mt-6 text-sm text-center text-[#B6C6DA]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#64FFDA] hover:underline font-medium">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}