'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import UserAttendanceTable from '@/ui/Attendance'
import Loader from '@/components/LottieLoader'
import Placeholder from '../../public/Images/Profile-Placeholder.png'

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

const DynamicUserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canAccess, setCanAccess] = useState(false)
  
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

  const handleEditProfile = (): void => {
    if (currentUser?.id === user?.id || currentUser?.role?.toLowerCase() === 'manager') {
      router.push(`/profile/${userId}/edit`)
    } else {
      setError('You can only edit your own profile')
    }
  }

  const handleBackToList = (): void => {
    if (currentUser?.role?.toLowerCase() === 'manager') {
      router.push('/manager/dashboard') 
    } else {
      router.push('/') 
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400}/>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={handleBackToList}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">User not found</h2>
          <p className="text-gray-500 mt-2">The requested user could not be found or you don't have permission to view it.</p>
          <button
            onClick={handleBackToList}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleBackToList}
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative">
                  <Image
                    src={user.imageUrl || Placeholder}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-full"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {user.firstName || user.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : 'User Profile'
                    }
                  </h1>
                  <p className="text-blue-100 mt-1">{user.role || 'Care Worker'}</p>
                  {!isOwnProfile && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-500 text-white rounded">
                      Viewing as {currentUser?.role || 'Manager'}
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">First Name</label>
                    <p className="mt-1 text-lg text-gray-900">{user.firstName || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Name</label>
                    <p className="mt-1 text-lg text-gray-900">{user.lastName || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Gender</label>
                    <p className="mt-1 text-lg text-gray-900">{user.gender || 'Not specified'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Phone Number</label>
                    <p className="mt-1 text-lg text-gray-900">{user.number || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Address</label>
                    <p className="mt-1 text-lg text-gray-900">{user.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{user.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role</label>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {user.role || 'Care Worker'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Reporting Time</label>
                  <p className="mt-1 text-lg text-gray-900">{user.reportingTime || 'Not set'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Working Hours</label>
                  <p className="mt-1 text-lg text-gray-900">
                    {user.totalWorkingHours ? `${user.totalWorkingHours} hours/day` : 'Not set'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.latitude && user.longitude 
                      ? `${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}`
                      : 'Not set'
                    }
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Member Since</label>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex gap-4">
              {canEdit && (
                <button
                  onClick={handleEditProfile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
              
              <button
                onClick={handleBackToList}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <UserAttendanceTable 
            userId={userId}
            showAllUsers={false}
            maxRows={10}
          />
        </div>
      </div>
    </div>
  )
}

export default DynamicUserProfilePage;