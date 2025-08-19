'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import UserAttendanceTable from '@/ui/Attendance'
import Loader from '@/components/LottieLoader'
import Placeholder from '../../public/Images/Profile-Placeholder.png'
import { User, Edit, Home, LayoutDashboard, MapPin, Menu, X } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  number?: string
  address?: string
  role?: string
  gender?: string
  latitude?: number
  longitude?: number
  reportingTime?: string
  totalWorkingHours?: number
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

interface GetUserByIdResponse {
  getUserById: User
}

const DynamicProfile = () => {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canAccess, setCanAccess] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string
  const supabase = createClientComponentClient()

  const getUserById = async (userId: string): Promise<User> => {
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
                number
                address
                role
                gender
                latitude
                longitude
                reportingTime
                totalWorkingHours
                imageUrl
                createdAt
                updatedAt
              }
            }
          `,
          variables: { id: userId },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: GraphQLResponse<GetUserByIdResponse> = await response.json()

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error occurred')
      }

      if (!result.data?.getUserById) {
        throw new Error('User not found')
      }

      return result.data.getUserById
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user'
      throw new Error(errorMessage)
    }
  }

  const checkAccess = (currentUser: User, targetUserId: string): boolean => {
    if (currentUser.role?.toLowerCase() === 'manager') {
      return true
    }

    if (currentUser.role?.toLowerCase() === 'care worker' || !currentUser.role) {
      return currentUser.id === targetUserId
    }

    return false
  }

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }

        if (!authUser) {
          throw new Error('No authenticated user found')
        }

        const currentUserData = await getUserById(authUser.id)

        if (!currentUserData) {
          throw new Error('Current user not found in database')
        }

        setCurrentUser(currentUserData)

        const hasAccess = checkAccess(currentUserData, userId)

        if (!hasAccess) {
          setError('Access denied. You can only view profiles you have permission to access.')
          setCanAccess(false)
          return
        }

        setCanAccess(true)

        const targetUserData = await getUserById(userId)

        if (!targetUserData) {
          throw new Error('User not found')
        }

        setUser(targetUserData)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.getElementById('menu-button')

      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node) &&
        menuButton && !menuButton.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleEditProfile = (): void => {
    if (currentUser?.id === user?.id || currentUser?.role?.toLowerCase() === 'manager') {
      router.push(`/profile/${userId}/edit`)
    } else {
      setError('You can only edit your own profile')
    }
    setSidebarOpen(false)
  }

  const handleLocation = (): void => {
    router.push('/manager/location')
    setSidebarOpen(false)
  }

  const handleDashboard = (): void => {
    router.push('/manager/dashboard')
    setSidebarOpen(false)
  }

  const handleBackToHome = (): void => {
    router.push('/')
    setSidebarOpen(false)
  }

  const getUserDisplayName = (): string => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-700">User not found</h2>
          <p className="text-gray-500 mt-2">The requested user could not be found or you don't have permission to view it.</p>
          <button
            onClick={handleBackToHome}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.id
  const canEdit = isOwnProfile || currentUser?.role?.toLowerCase() === 'manager'
  const isManager = currentUser?.role?.toLowerCase() === 'manager'

  return (
    <div className='min-h-screen bg-bg'>
      <header className="lg:hidden flex items-center py-2 px-4 justify-between bg-bg border-b-2 border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={user.imageUrl || Placeholder}
              alt="Profile"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-text">{getUserDisplayName()}</h1>
            <p className="text-sm text-gray-500">{user.role || 'Care Worker'}</p>
          </div>
        </div>

        <button
          id="menu-button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X size={28} className="text-text" strokeWidth={2} />
          ) : (
            <Menu size={28} className="text-text" strokeWidth={2} />
          )}
        </button>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" />
      )}

      {sidebarOpen && (
        <div
          id="mobile-sidebar"
          className="fixed top-[73px] right-4 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 lg:hidden max-h-[calc(100vh-120px)] overflow-y-auto"
        >
          <div className="p-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={user.imageUrl || Placeholder}
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div>
                <p className="font-semibold text-text">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                {user.role && (
                  <p className="text-xs text-brand font-medium capitalize">{user.role}</p>
                )}
              </div>
            </div>

            <div className="py-3 space-y-2">
              <div className='flex items-center gap-3 bg-[#47f2ca80] p-2 rounded-lg w-full'>
                <User size={16} className="text-text" strokeWidth={1.7} />
                <span className='font-medium text-sm'>Personal Information</span>
              </div>

              {canEdit && (
                <button
                  type="button"
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2"
                  onClick={handleEditProfile}
                >
                  <Edit size={16} strokeWidth={1.7} />
                  Edit Profile
                </button>
              )}

              <button
                type="button"
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2"
                onClick={handleBackToHome}
              >
                <Home size={16} strokeWidth={1.7} />
                Back To Home
              </button>

              {isManager && (
                <>
                  <button
                    type="button"
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2"
                    onClick={handleDashboard}
                  >
                    <LayoutDashboard size={16} strokeWidth={1.7} />
                    Dashboard
                  </button>

                  <button
                    type="button"
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-text font-medium text-sm flex items-center gap-2"
                    onClick={handleLocation}
                  >
                    <MapPin size={16} strokeWidth={1.7} />
                    Office Location
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="lg:flex lg:gap-8 lg:p-8">
        <div className="hidden lg:flex lg:w-80 bg-white rounded-xl flex-col  p-8">
          <div className='flex flex-col items-center gap-4'>
            <div className="w-40 h-40 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative border-2 border-gray-200">
              <Image
                src={user?.imageUrl || Placeholder}
                alt="Profile"
                width={160}
                height={160}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            <div className='font-semibold text-text text-2xl text-center'>{getUserDisplayName()}</div>
            <div className='font-semibold text-stext text-center mb-4'>{user?.role || 'Care Worker'}</div>
          </div>

          <div className="w-full space-y-4">
            <div className='flex items-center gap-3 bg-[#47f2ca80] py-3 px-4 rounded-xl w-full'>
              <User size={20} strokeWidth={1.7} />
              <span className='font-semibold'>Personal Information</span>
            </div>

            {canEdit && (
              <div
                className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
                onClick={handleEditProfile}
              >
                <Edit size={20} strokeWidth={1.7} />
                <span className='font-semibold'>Edit</span>
              </div>
            )}

            <div
              className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
              onClick={handleBackToHome}
            >
              <Home size={20} strokeWidth={1.7} />
              <span className='font-semibold'>Back To Home</span>
            </div>

            {isManager && (
              <>
                <div
                  className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
                  onClick={handleDashboard}
                >
                  <LayoutDashboard size={20} strokeWidth={1.7} />
                  <span className='font-semibold'>Dashboard</span>
                </div>
                <div
                  className='flex items-center gap-3 hover:bg-gray-50 py-3 px-4 rounded-xl w-full cursor-pointer transition-colors'
                  onClick={handleLocation}
                >
                  <MapPin size={20} strokeWidth={1.7} />
                  <span className='font-semibold'>Office Location</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className='flex-1 p-4 lg:p-0'>
          <div className='bg-white rounded-xl p-4 lg:p-8 flex flex-col gap-6'>
            <div>
              <div className='font-semibold text-xl lg:text-2xl text-text mb-6'>Personal Information</div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
                <div className='flex flex-col'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>Gender</span>
                  <span className='text-text mt-1'>{user?.gender || 'Not specified'}</span>
                </div>
                <div className='flex flex-col'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>Name</span>
                  <span className='text-text mt-1'>{getUserDisplayName()}</span>
                </div>
                <div className='flex flex-col sm:col-span-2 lg:col-span-1'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>User ID</span>
                  <span className='font-mono text-xs lg:text-sm bg-gray-100 px-2 py-1 rounded text-text mt-1 break-all w-fit'>{user?.id}</span>
                </div>
                <div className='flex flex-col'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>Email</span>
                  <span className='text-text mt-1 break-all'>{user?.email}</span>
                </div>
                <div className='flex flex-col'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>Phone</span>
                  <span className='text-text mt-1'>{user?.number || 'Not provided'}</span>
                </div>
                <div className='flex flex-col sm:col-span-2 lg:col-span-1'>
                  <span className='font-semibold text-gray-600 text-sm lg:text-base'>Address</span>
                  <span className='text-text mt-1'>{user?.address || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className='font-semibold text-lg lg:text-xl text-text mb-4'>Attendance Records</h3>
              <div className='w-full overflow-x-auto'>
                <UserAttendanceTable
                  userId={userId}
                  showAllUsers={false}
                  maxRows={25}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicProfile