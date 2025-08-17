'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Card from '@/ui/Card'
import { UserRoundCheck, ClockPlus, Clock2, UserRoundX, User } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

const Detail : React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const getUserById = async (userId: string) => {
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
                imageUrl
                createdAt
                updatedAt
              }
            }
          `,
          variables: { id: userId },
        }),
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      return result.data.getUserById
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch user')
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }

        if (!authUser) {
          throw new Error('No authenticated user found')
        }

        const userData = await getUserById(authUser.id)
        
        if (!userData) {
          throw new Error('User not found in database')
        }

        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const getUserDisplayName = () => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  }

  const ProfileImage = () => {
    return (
      <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-gray-200">
        <Image
          src={user?.imageUrl || Placeholder}
          alt={`${getUserDisplayName()} Profile`}
          width={80}
          height={80}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className='bg-white w-19/20 rounded-xl mt-6 p-6 flex flex-col gap-8'>
        <div className='w-full font-semibold text-text text-lg'>Care Worker Details</div>
        <div className='flex items-center justify-center py-12'>
          <Loader />
          <span className="ml-3 text-text">Loading user data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-white w-19/20 rounded-xl mt-6 p-6 flex flex-col gap-8'>
        <div className='w-full font-semibold text-text text-lg'>Care Worker Details</div>
        <div className='flex items-center justify-center py-12'>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='bg-white w-19/20 rounded-xl mt-6 p-6 flex flex-col gap-8'>
        <div className='w-full font-semibold text-text text-lg'>Care Worker Details</div>
        <div className='flex items-center justify-center py-12'>
          <div className="text-center text-gray-500">
            <p>No user data found</p>
          </div>
        </div>
      </div>
    )
  }

  const Data = {
    ID: user.id,
    Number: user.number || 'Not provided',
    Email: user.email,
    Address: user.address || 'Not provided'
  }

  const fullName = getUserDisplayName()

  return (
    <div className='bg-white w-19/20 rounded-xl mt-6 p-6 flex flex-col gap-8'>
      <div className='w-full font-semibold text-text text-lg'>Care Worker Details</div>
      <div className='flex items-center gap-8'>
        <ProfileImage />
        <div className='flex flex-col gap-2'>
          <div className='font-semibold text-text'>{fullName}</div>
          <div className='text-sm text-gray-600'>{user.role || 'Care Worker'}</div>
          <div className='flex items-center gap-12 mt-2'>
            {Object.entries(Data).map(([key, value]) => (
              <div key={key} className='flex flex-col gap-2'>
                <div className='text-xs text-stext font-semibold'>{key}</div>
                <div className='text-xs text-text font-semibold'>
                  {key === 'ID' ? (
                    <span className="font-mono text-xs">{String(value).substring(0, 8)}...</span>
                  ) : key === 'Email' ? (
                    <span className="max-w-32 truncate block" title={String(value)}>
                      {String(value)}
                    </span>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='flex justify-around'>
        <Card icon={<UserRoundCheck/>} title='13 Days' subtitle='Total Attendance' iconBg='bg-bzero'/>
        <Card icon={<ClockPlus/>} title='7 Days' subtitle='Late Attendance' iconBg='bg-bone'/>
        <Card icon={<Clock2/>} title='1 Days' subtitle='Undertime Attendance' iconBg='bg-btwo'/>
        <Card icon={<UserRoundX />} title='2 Days' subtitle='Total Absent' iconBg='bg-bthree'/>
      </div>
    </div>
  )
}

export default Detail