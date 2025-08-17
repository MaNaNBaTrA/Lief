'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import UserAttendanceTable from '@/ui/Attendance'
import Loader from '@/components/LottieLoader'
import Placeholder from '../../public/Images/Profile-Placeholder.png'
import PersonIcon from '@mui/icons-material/Person';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';

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

  const handleLocation = (): void => {
    router.push('/manager/location')
  }

  const handleDashboard = (): void => {
    router.push('/manager/dashboard')
  }

  const handleBackToList = (): void => {
    if (currentUser?.role?.toLowerCase() === 'manager') {
      router.push('/manager/dashboard')
    } else {
      router.push('/')
    }
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
  const isManager = currentUser?.role?.toLowerCase() === 'manager'

  return (
    <div className='w-screen h-screen bg-bg p-8 flex gap-8'>
      <div className='w-[20%]  bg-white rounded-xl flex flex-col items-center p-8 gap-4 sticky top-8'>
        <div className='flex flex-col items-center gap-2'>
          <div className="w-40 h-40 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative">
            <Image
              src={user.imageUrl || Placeholder}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <div className='font-semibold text-text text-2xl'>{getUserDisplayName()}</div>
          <div className='font-semibold text-stext '>{user.role || 'Care Worker'}</div>
        </div>
        <div className='flex items-center gap-3 bg-[#47f2ca80] py-2 px-3 rounded-xl w-full cursor-pointer'>
          <PersonIcon />
          <span className='font-semibold'>Personal Information</span>
        </div>
        <div className='flex items-center gap-3  py-2 px-3 rounded-xl w-full  cursor-pointer'
          onClick={handleEditProfile}
        >
          <ModeEditIcon />
          <span className='font-semibold'>Edit</span>
        </div>
        <div className='flex items-center gap-3  py-2 px-3 rounded-xl w-full cursor-pointer '
          onClick={() => router.push('/')}
        >
          <HomeFilledIcon sx={{ fontSize: 20 }} />
          <span className='font-semibold'>Back To Home</span>
        </div>
        {isManager &&
          <>
            <div className='flex items-center gap-3  py-2 px-3 rounded-xl w-full cursor-pointer '
              onClick={() => router.push('/manager/dashboard')}
            >
              <SpaceDashboardIcon />
              <span className='font-semibold'>Dashboard</span>
            </div>
            <div className='flex items-center gap-3  py-2 px-3 rounded-xl w-full cursor-pointer '
              onClick={() => router.push('/manager/location')}
            >
              <EditLocationAltIcon/>
              <span className='font-semibold'>Office Location</span>
            </div>
          </>
        }
      </div>
      
      <div className='w-[80%]  overflow-y-auto '>
        <div className='bg-white rounded-xl p-8 flex flex-col gap-6'>
          <div className='font-semibold text-2xl text-text '>Personal Information</div>
          <div className='grid grid-cols-3 gap-6'>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600 '>Gender</span>
              <span className='text-text'>{user.gender || 'Not specified'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600 '>Name</span>
              <span className='text-text'>{getUserDisplayName()}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600 '>User ID</span>
              <span className='font-mono text-sm bg-gray-100 px-2 py-1 rounded text-text'>{user.id}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600'>Email</span>
              <span className='text-text'>{user.email}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600 '>Phone</span>
              <span className='text-text'>{user.number || 'Not provided'}</span>
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-600'>Address</span>
              <span className='text-text'>{user.address || 'Not provided'}</span>
            </div>
          </div>
          
          <div className='w-full'>
            <UserAttendanceTable 
              userId={userId}
              showAllUsers={false}
              maxRows={25} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicProfile