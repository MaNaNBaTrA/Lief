'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

const SignUpPage = () => {

    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [passwordLoading, setPasswordLoading] = useState<boolean>(false)
    const [googleLoading, setGoogleLoading] = useState<boolean>(false)
    const [focusedInput, setFocusedInput] = useState<string>('')

    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/');
            }
        };
        checkUser();
    }, [router]);

    const showToast = (message: string, type: 'error' | 'warning' | 'success') => {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const alertClass = type === 'error' ? 'alert-error' : type === 'warning' ? 'alert-warning' : 'alert-success';

        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast toast-top toast-center';
        toastContainer.innerHTML = `
            <div class="alert ${alertClass}">
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toastContainer);

        setTimeout(() => {
            if (toastContainer.parentNode) {
                toastContainer.remove();
            }
        }, 4000);
    };

    const SigninClick = () => {
        router.push('/signin');
    };

    const TermsClick = () => {
        router.push('/terms');
    };

    const PrivacyClick = () => {
        router.push('/privacy');
    };

    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const getPasswordValidation = () => {
        const hasMinLength = password.length >= 8;
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);

        return {
            hasMinLength,
            hasSymbol,
            hasNumber,
            hasUpperCase,
            hasLowerCase,
            isValid: hasMinLength && hasSymbol && hasNumber && hasUpperCase && hasLowerCase
        };
    };

    const passwordValidation = getPasswordValidation();
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // First, fix your checkUserExists function to return null on API failure
    const checkUserExists = async (email: string): Promise<boolean | null> => {
        try {
            console.log('🔍 Checking if user exists via API:', email);

            const res = await fetch('/api/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                console.error('API returned error status:', res.status);
                // Return null to indicate API failure, not "user doesn't exist"
                return null;
            }

            const data = await res.json();
            console.log('📊 API User exists check result:', data.exists);
            return !!data.exists;

        } catch (err) {
            console.error('💥 Exception in user existence check API call:', err);
            // Return null to indicate failure, not false
            return null;
        }
    };

    // Then update your handleSignUp function
    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            showToast('Please fill in all fields.', 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address.', 'warning');
            return;
        }

        if (!passwordValidation.isValid) {
            showToast('Please ensure your password meets all requirements.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'warning');
            return;
        }

        setPasswordLoading(true);

        try {
            console.log('🚀 Starting signup process for:', email);

            const userExists = await checkUserExists(email);

            // Handle API failure case
            if (userExists === null) {
                console.error('❌ Could not check if user exists due to API error');
                showToast('Unable to verify account status. Please try again later.', 'error');
                return;
            }

            if (userExists === true) {
                console.log('👤 User already exists in database');
                showToast('Account already exists with this email. Please sign in instead.', 'error');
                setTimeout(() => {
                    router.push('/signin');
                }, 2000);
                return;
            }

            console.log('✅ User does not exist, proceeding with signup');

            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
            });

            console.log('📊 Supabase Signup Response Data:', data);
            console.log('❌ Supabase Signup Error:', error);

            if (error) {
                console.log('🔍 Signup Error Details:');
                console.log('  - Message:', error.message);
                console.log('  - Status:', error.status);
                console.log('  - Name:', error.name);

                if (error.message.includes('User already registered') ||
                    error.message.includes('already registered') ||
                    error.message.includes('already exists') ||
                    error.message.includes('email_address_taken') ||
                    error.message.includes('duplicate') ||
                    error.message.includes('Email rate limit exceeded') ||
                    error.status === 422 ||
                    error.status === 429) {
                    console.log('🔄 Detected duplicate/existing user error from Supabase');
                    showToast('Account already exists with this email. Please sign in instead.', 'error');

                } else if (error.message.includes('Password should be at least')) {
                    console.log('🔒 Password requirement error');
                    showToast('Password does not meet minimum requirements.', 'error');
                } else if (error.message.includes('Invalid email')) {
                    console.log('📧 Invalid email error');
                    showToast('Please enter a valid email address.', 'warning');
                } else if (error.message.includes('signup_disabled')) {
                    console.log('🚫 Signup disabled error');
                    showToast('Account registration is currently disabled.', 'error');
                } else if (error.message.includes('weak_password')) {
                    console.log('🔐 Weak password error');
                    showToast('Password is too weak. Please choose a stronger password.', 'error');
                } else {
                    console.log('❓ Unknown error type, showing generic message');
                    showToast(`Sign up failed: ${error.message}`, 'error');
                }
                return;
            }

            if (data.user) {
                console.log('✅ User created successfully:', data.user);
                console.log('📧 User email:', data.user.email);
                console.log('🆔 User ID:', data.user.id);
                console.log('📅 Created at:', data.user.created_at);
                console.log('🔐 Email confirmed:', data.user.email_confirmed_at);

                showToast('Account created successfully! Please check your email to verify your account.', 'success');

            } else {
                console.log('⚠️ No user in response but no error either');
                showToast('Something unexpected happened. Please try again.', 'warning');
            }

        } catch (err: any) {
            console.error('💥 Unexpected error during signup:', err);
            console.log('Error name:', err.name);
            console.log('Error message:', err.message);

            if (err.name === 'AbortError') {
                showToast('Request timed out. Please try again.', 'error');
            } else if (err.message?.includes('fetch')) {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('An unexpected error occurred. Please try again.', 'error');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true)

        try {
            console.log('🔗 Starting Google OAuth signup');

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                console.error('🔗❌ Google sign up error:', error);
                console.log('Google error details:', JSON.stringify(error, null, 2));

                if (error.message.includes('Provider not enabled')) {
                    showToast('Google sign-up is not enabled. Please contact support.', 'error');
                } else if (error.message.includes('signup_disabled')) {
                    showToast('Google sign-up is currently disabled.', 'error');
                } else {
                    showToast(`Google sign up failed: ${error.message}`, 'error');
                }
                setGoogleLoading(false)
                return
            }

            console.log('🔗✅ Google OAuth initiated successfully');

        } catch (err: any) {
            console.error('🔗💥 Unexpected Google OAuth error:', err);
            if (err.name === 'AbortError') {
                showToast('Request timed out. Please try again.', 'error');
            } else if (err.message?.includes('fetch')) {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('Failed to sign up with Google. Please try again.', 'error');
            }
            setGoogleLoading(false)
        }
    }

    const isAnyLoading = passwordLoading || googleLoading

    return (
        <main className='flex'>
            <section className='w-2/5 bg-base-100 h-screen'>
                <div className='w-full h-[15%] flex items-center pl-10'>
                    <Image
                        src="/Name.svg"
                        width={110}
                        height={110}
                        alt='Lief'
                    />
                </div>
                <div className='w-full h-[75%] center'>
                    <div className='h-full w-7/10 flex flex-col'>
                        <div className="flex flex-col gap-2">
                            <span className="text-3xl font-semibold">Create your account</span>
                            <span className="text-sm font-medium text-base-content/70">Sign up to get started</span>
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            <div className="w-full flex flex-col gap-2">
                                <span className="font-medium text-sm">Email</span>
                                <label className="floating-label">
                                    <span>Your Email</span>
                                    <input
                                        type="email"
                                        placeholder="mail@site.com"
                                        className="input input-md w-full"
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isAnyLoading}
                                        required
                                        value={email}
                                    />
                                </label>
                            </div>

                            <div className="w-full flex flex-col gap-2 relative">
                                <div>
                                    <span className="font-medium text-sm">Password</span>
                                </div>

                                <label className="floating-label">
                                    <span>Your Password</span>
                                    <input
                                        type="password"
                                        placeholder="password"
                                        className="input input-md w-full"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput('')}
                                        disabled={isAnyLoading}
                                        required
                                    />
                                </label>

                                {password && focusedInput === 'password' && (
                                    <div className="absolute left-full ml-4 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                                        <div className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</div>
                                        <div className="space-y-1">
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasMinLength ? '✓' : '✗'}</span>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasSymbol ? '✓' : '✗'}</span>
                                                <span>Contains a symbol (!@#$%^&*)</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                                                <span>Contains a number</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                                                <span>Contains uppercase letter</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                                                <span>Contains lowercase letter</span>
                                            </div>
                                        </div>
                                        <div className="absolute left-[-6px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-gray-200"></div>
                                        <div className="absolute left-[-5px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-white"></div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex flex-col gap-2 relative">
                                <div>
                                    <span className="font-medium text-sm">Confirm Password</span>
                                </div>

                                <label className="floating-label">
                                    <span>Confirm Your Password</span>
                                    <input
                                        type="password"
                                        placeholder="confirm password"
                                        className="input input-md w-full"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('confirmPassword')}
                                        onBlur={() => setFocusedInput('')}
                                        disabled={isAnyLoading}
                                        required
                                    />
                                </label>

                                {confirmPassword && focusedInput === 'confirmPassword' && (
                                    <div className="absolute left-full ml-4 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
                                        <div className={`text-xs flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            <span>{passwordsMatch ? '✓' : '✗'}</span>
                                            <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                                        </div>
                                        <div className="absolute left-[-6px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-gray-200"></div>
                                        <div className="absolute left-[-5px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-white"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 my-6">
                            <hr className="flex-grow border-t border-gray-300" />
                            <span className="text-sm">or</span>
                            <hr className="flex-grow border-t border-gray-300" />
                        </div>
                        <div className="">
                            <button
                                className="btn bg-info text-black border-[#e5e5e5] w-full rounded-md"
                                onClick={handleGoogleSignUp}
                                disabled={isAnyLoading}
                            >
                                {googleLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                                )}
                                {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                            </button>
                        </div>
                        <div className="mt-6">
                            <button
                                className="btn bg-white text-black border-[#e5e5e5] w-full rounded-md flex items-center justify-center"
                                onClick={handleSignUp}
                                disabled={isAnyLoading}
                            >
                                {passwordLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Email icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="black"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></g></svg>
                                )}
                                {passwordLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                        <div className="text-sm font-medium flex gap-1 center mt-8">
                            <span>Already have an account?</span>
                            <span className="underline cursor-pointer" onClick={SigninClick}>Sign In Now</span>
                        </div>

                    </div>
                </div>
                <div className='w-full h-[10%] text-xs font-medium center'>
                    <div className="w-7/10 text-center">
                        By continuing, you agree to Lief's <span onClick={TermsClick} className="underline cursor-pointer decoration-info">Terms of Service</span> and <span className="underline cursor-pointer decoration-info" onClick={PrivacyClick}>Privacy Policy</span>, and to receive periodic emails with updates.
                    </div>
                </div>
            </section>
            <section className='w-3/5 bg-base-200 h-screen'>

            </section>
        </main>
    )
}

export default SignUpPage