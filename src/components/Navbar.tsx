'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { LogOut, UserRoundCheck, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'


interface UserProfile {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
}

interface GraphQLResponse {
    data?: {
        getUserById?: UserProfile | null
    }
    errors?: Array<{
        message: string
        locations?: Array<{ line: number; column: number }>
        path?: string[]
    }>
}

const Navbar: React.FC = () => {
    const router = useRouter()
    const [showPopup, setShowPopup] = useState<boolean>(false)
    const [note, setNote] = useState<string>('')
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const getCurrentUser = async (): Promise<void> => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error) {
                    console.error('Error getting user:', error.message)
                    return
                }
                
                if (user) {
                    setUser(user)
                    await fetchUserProfile(user.id)
                }
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }

        getCurrentUser()
    }, [])

    const fetchUserProfile = async (userId: string): Promise<void> => {
        try {
            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        query GetUserById($id: String!) {
                            getUserById(id: $id) {
                                id
                                email
                                firstName
                                lastName
                                imageUrl
                            }
                        }
                    `,
                    variables: {
                        id: userId
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result: GraphQLResponse = await response.json()
            
            if (result.errors) {
                console.error('GraphQL errors:', result.errors)
                return
            }
            
            if (result.data?.getUserById) {
                setUserProfile(result.data.getUserById)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
        }
    }

    const handleLogout = async (): Promise<void> => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error.message)
            return
        }
        router.replace('/signin')
    }

    const handleCheckIn = (): void => {
        setShowPopup(true)
    }

    const handlePopupSubmit = (): void => {
        console.log('Optional Note:', note)
        setShowPopup(false)
        setNote('')
    }

    const getProfileImageSrc = (): string => {
        if (userProfile?.imageUrl) {
            return userProfile.imageUrl
        }
        return "/favicon.ico" 
    }

    const getUserDisplayName = (): string => {
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`
        }
        if (userProfile?.firstName) {
            return userProfile.firstName
        }
        return userProfile?.email || 'User'
    }

    return (
        <header className="flex items-center py-4 px-16 justify-between bg-bg border-b-2 border-border">
            <div>
                <Image
                    src="/Images/Lief.svg"
                    width={150}
                    height={150}
                    alt="Lief"
                    priority
                />
            </div>

            <nav className="flex items-center gap-12">
                <button
                    type="button"
                    className="text-text font-semibold text-lg hover:text-brand transition-colors duration-500 cursor-pointer"
                    onClick={() => router.push('/dashboard')}
                >
                    Dashboard
                </button>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="border border-text rounded-lg py-3 px-6 bg-white flex items-center gap-2 font-semibold hover:bg-gray-100 cursor-pointer"
                >
                    <LogOut color="#345e54" size={22} strokeWidth={1.7} />
                    Log Out
                </button>

                <button
                    type="button"
                    onClick={handleCheckIn}
                    className="bg-brand font-semibold text-white flex items-center py-3 px-6 gap-2 rounded-lg hover:bg-brand/90 cursor-pointer"
                >
                    <UserRoundCheck color="#ffffff" size={22} strokeWidth={1.7} />
                    Check In
                </button>

                <button
                    type="button"
                    className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-brand transition-colors duration-300"
                    onClick={() => router.push('/profile')}
                    title={getUserDisplayName()}
                >
                    {loading ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                            <User size={20} className="text-gray-400" />
                        </div>
                    ) : userProfile?.imageUrl ? (
                        <Image
                            src={getProfileImageSrc()}
                            alt={`${getUserDisplayName()} Profile`}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.src = "/favicon.ico"
                            }}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User size={20} className="text-gray-600" />
                        </div>
                    )}
                </button>
            </nav>

            {showPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">Optional Check-In Note</h2>
                        <textarea
                            value={note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                            placeholder="Write your note here..."
                            className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none"
                            rows={4}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPopup(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePopupSubmit}
                                className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors duration-200"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar