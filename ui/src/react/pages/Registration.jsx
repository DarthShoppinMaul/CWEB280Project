// Registration.jsx
// User registration page with Google Sign-Up option

import React, {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';

export default function Registration() {
    const {register} = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        phone: '',
        agreeToTerms: false
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        if (!password) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 10) return 'medium';
        if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
            return 'strong';
        }
        return 'medium';
    };

    // Handle input changes
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({...prev, [name]: newValue}));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: undefined}));
        }

        // Update password strength
        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }
    };

    // Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        } else if (formData.displayName.length < 2) {
            newErrors.displayName = 'Display name must be at least 2 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        try {
            const result = await register(formData);
            if (result.success) {
                navigate('/login');
            } else {
                setErrors({submit: result.error});
            }
        } catch (err) {
            setErrors({submit: 'Registration failed. Please try again.'});
        }

        setIsSubmitting(false);
    };

    // Handle Google Sign-Up
    const handleGoogleSignUp = () => {
        alert('Google Sign-Up would be triggered here. This redirects to Google OAuth.');
    };

    // Password strength indicator component
    const PasswordStrengthIndicator = () => {
        if (!passwordStrength) return null;

        const colors = {
            weak: 'bg-red-500',
            medium: 'bg-yellow-500',
            strong: 'bg-green-500'
        };

        const widths = {
            weak: 'w-1/3',
            medium: 'w-2/3',
            strong: 'w-full'
        };

        return (
            <div className="mt-2">
                <div className="flex gap-1 h-1">
                    <div className={`flex-1 rounded-full ${passwordStrength ? colors[passwordStrength] : 'bg-[#233554]'} ${widths[passwordStrength]}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength === 'medium' || passwordStrength === 'strong' ? colors[passwordStrength] : 'bg-[#233554]'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength === 'strong' ? colors[passwordStrength] : 'bg-[#233554]'}`}></div>
                </div>
                <div className="text-xs mt-1 text-[#B6C6DA] capitalize">
                    Password strength: {passwordStrength}
                </div>
            </div>
        );
    };

    return (
        <div className="container-narrow">
            <h1 className="text-3xl mb-6 text-center">Create Your Account</h1>

            <div className="panel max-w-md mx-auto">
                <form onSubmit={handleSubmit}>
                    {/* Overall submission error */}
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-400 rounded-xl">
                            {errors.submit}
                        </div>
                    )}

                    {/* Email */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Email *</label>
                        <input
                            type="email"
                            name="email"
                            className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="your@email.com"
                        />
                        {errors.email && (
                            <div className="text-red-400 text-sm mt-1">{errors.email}</div>
                        )}
                    </div>

                    {/* Display Name */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Display Name *</label>
                        <input
                            type="text"
                            name="displayName"
                            className={`input w-full ${errors.displayName ? 'border-red-500' : ''}`}
                            value={formData.displayName}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="John Doe"
                        />
                        {errors.displayName && (
                            <div className="text-red-400 text-sm mt-1">{errors.displayName}</div>
                        )}
                    </div>

                    {/* Phone (optional) */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Phone (Optional)</label>
                        <input
                            type="tel"
                            name="phone"
                            className={`input w-full ${errors.phone ? 'border-red-500' : ''}`}
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="+1 (555) 123-4567"
                        />
                        {errors.phone && (
                            <div className="text-red-400 text-sm mt-1">{errors.phone}</div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Password *</label>
                        <input
                            type="password"
                            name="password"
                            className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <div className="text-red-400 text-sm mt-1">{errors.password}</div>
                        )}
                        <PasswordStrengthIndicator />
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium">Confirm Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className={`input w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={isSubmitting}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <div className="text-red-400 text-sm mt-1">{errors.confirmPassword}</div>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mb-6">
                        <label className="flex items-start cursor-pointer">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                                className="w-4 h-4 mt-1 rounded border-[#3a5a86] bg-[#143058] text-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:ring-offset-0"
                                disabled={isSubmitting}
                            />
                            <span className="ml-2 text-sm">
                                I agree to the{' '}
                                <Link to="/terms" className="text-[#64FFDA] hover:underline">
                                    Terms and Conditions
                                </Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-[#64FFDA] hover:underline">
                                    Privacy Policy
                                </Link>
                            </span>
                        </label>
                        {errors.agreeToTerms && (
                            <div className="text-red-400 text-sm mt-1">{errors.agreeToTerms}</div>
                        )}
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="btn w-full mb-4"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#1b355e]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#112240] text-[#B6C6DA]">Or sign up with</span>
                        </div>
                    </div>

                    {/* Google Sign-Up button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
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
                        Sign up with Google
                    </button>

                    {/* Link to login */}
                    <div className="mt-6 text-sm text-center text-[#B6C6DA]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#64FFDA] hover:underline font-medium">
                            Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}