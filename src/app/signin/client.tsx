'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

const SignInPage : React.FC = () => {

    const [checked, setChecked] = useState<boolean>(false)
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [passwordLoading, setPasswordLoading] = useState<boolean>(false)
    const [magicLoading, setMagicLoading] = useState<boolean>(false)
    const [googleLoading, setGoogleLoading] = useState<boolean>(false)

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
        toastContainer.className = 'toast toast-top toast-end';
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

    const SignupClick = () => {
        router.push('/signup');
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

    const handleLoginWithPassword = async () => {
        if (!email || !password) {
            showToast('Please fill in all fields.', 'warning');
            return
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address.', 'warning');
            return
        }

        setPasswordLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            })

            if (error) {
                console.error('Sign in error:', error)

                if (error.message.includes('Invalid login credentials') ||
                    error.message.includes('Invalid email or password') ||
                    error.message.includes('invalid_credentials')) {
                    showToast('Invalid email or password. Please check your credentials.', 'error');
                } else if (error.message.includes('Email not confirmed')) {
                    showToast('Please verify your email address before signing in. Check your inbox for a verification link.', 'error');
                } else if (error.message.includes('Too many requests')) {
                    showToast('Too many login attempts. Please wait a few minutes before trying again.', 'error');
                } else if (error.message.includes('User not found')) {
                    showToast('No account found with this email address. Please sign up first.', 'error');
                } else if (error.message.includes('Invalid email')) {
                    showToast('Please enter a valid email address.', 'warning');
                } else if (error.message.includes('signup_disabled')) {
                    showToast('Account registration is currently disabled.', 'error');
                } else {
                    showToast(`Sign in failed: ${error.message}`, 'error');
                }
                return
            }

            if (data.user) {
                console.log('Sign in successful')
                router.push('/')
            }
        } catch (err: any) {
            console.error('Unexpected error:', err)
            if (err.name === 'AbortError') {
                showToast('Request timed out. Please try again.', 'error');
            } else if (err.message?.includes('fetch')) {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('An unexpected error occurred. Please try again.', 'error');
            }
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleLoginWithMagic = async () => {
        if (!email) {
            showToast('Please enter your email address.', 'warning');
            return
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address.', 'warning');
            return
        }

        setMagicLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim().toLowerCase(),
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                console.error('Magic link error:', error)

                if (error.message.includes('Invalid email')) {
                    showToast('Please enter a valid email address.', 'warning');
                } else if (error.message.includes('Too many requests') ||
                    error.message.includes('rate limit') ||
                    error.message.includes('Email rate limit exceeded')) {
                    showToast('Too many requests. Please wait a few minutes before requesting another magic link.', 'error');
                } else if (error.message.includes('signup_disabled')) {
                    showToast('Magic link sign-in is currently disabled.', 'error');
                } else {
                    showToast(`Failed to send magic link: ${error.message}`, 'error');
                }
                return
            }

            showToast('Magic link sent! Check your email and click the link to sign in. Don\'t forget to check spam folder!', 'success');
        } catch (err: any) {
            console.error('Unexpected error:', err)
            if (err.name === 'AbortError') {
                showToast('Request timed out. Please try again.', 'error');
            } else if (err.message?.includes('fetch')) {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('An unexpected error occurred. Please try again.', 'error');
            }
        } finally {
            setMagicLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                console.error('Google sign in error:', error)

                if (error.message.includes('Provider not enabled')) {
                    showToast('Google sign-in is not enabled. Please contact support.', 'error');
                } else if (error.message.includes('signup_disabled')) {
                    showToast('Google sign-in is currently disabled.', 'error');
                } else {
                    showToast(`Google sign in failed: ${error.message}`, 'error');
                }
                setGoogleLoading(false)
                return
            }

        } catch (err: any) {
            console.error('Unexpected error:', err)
            if (err.name === 'AbortError') {
                showToast('Request timed out. Please try again.', 'error');
            } else if (err.message?.includes('fetch')) {
                showToast('Network error. Please check your connection and try again.', 'error');
            } else {
                showToast('Failed to sign in with Google. Please try again.', 'error');
            }
            setGoogleLoading(false)
        }
    }

    const isAnyLoading = passwordLoading || magicLoading || googleLoading

    return (
        <main className='flex '>
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
                            <span className="text-3xl font-semibold">Welcome back</span>
                            <span className="text-sm font-medium text-base-content/70">Sign in to your account</span>
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            <div className="relative border flex rounded-md py-3 px-4 justify-between items-center border-[#d7dce1]">
                                <div className="text-xs font-medium absolute -top-2 left-2 bg-base-100 px-1 ">Choose your sign in method</div>
                                <div className="text-sm font-semibold">Password</div>
                                <input 
                                    type="checkbox" 
                                    onChange={(e) => setChecked(e.target.checked)} 
                                    className="toggle toggle-info"
                                    disabled={isAnyLoading}
                                />
                                <div className="text-sm font-semibold">Magic Link</div>
                            </div>
                            <div className="w-full flex flex-col gap-2">
                                <span className="font-medium text-sm ">Email</span>
                                <label className="floating-label">
                                    <span >Your Email</span>
                                    <input 
                                        type="email" 
                                        placeholder="mail@site.com" 
                                        className="input input-md w-full " 
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isAnyLoading}
                                        required 
                                        value={email} 
                                    />
                                </label>
                            </div>

                            {!checked &&
                                <div className="w-full flex flex-col gap-2">
                                    <div>
                                        <span className="font-medium text-sm ">Password</span>
                                    </div>

                                    <label className="floating-label">
                                        <span>Your Password</span>
                                        <input 
                                            type="password" 
                                            placeholder="password" 
                                            className="input input-md w-full " 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isAnyLoading}
                                            required 
                                        />
                                    </label>
                                </div>
                            }
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 my-6">
                            <hr className="flex-grow border-t border-gray-300" />
                            <span className="text-sm">or</span>
                            <hr className="flex-grow border-t border-gray-300" />
                        </div>
                        <div className="">
                            <button 
                                className="btn bg-info text-black border-[#e5e5e5] w-full rounded-md" 
                                onClick={handleGoogleLogin} 
                                disabled={isAnyLoading}
                            >
                                {googleLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0090 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
                                )}
                                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
                            </button>
                        </div>
                        <div className="mt-6">
                            <button 
                                className="btn bg-white text-black border-[#e5e5e5] w-full rounded-md flex items-center justify-center" 
                                onClick={checked === true ? handleLoginWithMagic : handleLoginWithPassword}
                                disabled={isAnyLoading}
                            >
                                {(checked ? magicLoading : passwordLoading) ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Email icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="black"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></g></svg>
                                )}
                                {checked ? 
                                    (magicLoading ? 'Sending Magic Link...' : 'Send Magic Link') : 
                                    (passwordLoading ? 'Signing in...' : 'Sign in with Mail')
                                }
                            </button>
                        </div>
                        <div className="text-sm font-medium flex gap-1 center mt-8">
                            <span>Don't have an account?</span>
                            <span className="underline cursor-pointer" onClick={SignupClick}>Sign Up Now</span>
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

export default SignInPage;