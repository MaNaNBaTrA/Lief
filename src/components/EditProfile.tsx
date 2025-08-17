'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Loader from '@/components/LottieLoader'
import Placeholder from '../../public/Images/Profile-Placeholder.png'
import PersonIcon from '@mui/icons-material/Person';
import HomeFilledIcon from '@mui/icons-material/HomeFilled';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useToast } from '@/context/ToastContext';

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

const EditProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    number: '',
    address: '',
    gender: '',
    imageUrl: ''
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()
  const params = useParams()
  const userId = params?.id as string
  const { showToast } = useToast();
  const router = useRouter();

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      throw new Error('Image upload failed')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image size should be less than 5MB'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const imageUrl = await uploadToCloudinary(file)
      setEditForm(prev => ({ ...prev, imageUrl }))
      setHasChanges(true)
      showToast('Image uploaded successfully!', 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const updateUser = async (userId: string, updateData: Partial<User>) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation UpdateUser($id: String!, $data: UpdateUserInput!) {
              updateUser(id: $id, data: $data) {
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
          variables: { 
            id: userId,
            data: updateData
          },
        }),
      })

      const result = await response.json()
      
      if (result.errors) {
        const errorMsg = result.errors[0].message
        showToast(errorMsg, 'error')
        throw new Error(errorMsg)
      }

      return result.data.updateUser
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update user'
      if (!(err instanceof Error) || !err.message.includes('errors[0].message')) {
        showToast(errorMsg, 'error')
      }
      throw new Error(errorMsg)
    }
  }

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

      const result = await response.json()
      
      if (result.errors) {
        const errorMsg = result.errors[0].message
        showToast(errorMsg, 'error')
        throw new Error(errorMsg)
      }

      return result.data.getUserById
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch user'
      if (!(err instanceof Error) || !err.message.includes('errors[0].message')) {
        showToast(errorMsg, 'error')
      }
      throw new Error(errorMsg)
    }
  }

  const checkEditAccess = (currentUser: User, targetUserId: string): boolean => {
    if (currentUser.role?.toLowerCase() === 'manager') {
      return true
    }
    
    return currentUser.id === targetUserId
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          const errorMsg = 'Authentication error: ' + authError.message
          setError(errorMsg)
          showToast(errorMsg, 'error')
          throw new Error(errorMsg)
        }

        if (!authUser) {
          showToast('Please log in to continue', 'warning')
          router.push('/login') 
          return
        }

        const currentUserData = await getUserById(authUser.id)
        
        if (!currentUserData) {
          const errorMsg = 'Current user not found in database'
          setError(errorMsg)
          showToast(errorMsg, 'error')
          throw new Error(errorMsg)
        }

        setCurrentUser(currentUserData)

        const hasEditAccess = checkEditAccess(currentUserData, userId)
        
        if (!hasEditAccess) {
          const errorMsg = 'Access denied. You can only edit profiles you have permission to modify.'
          setError(errorMsg)
          showToast(errorMsg, 'error')
          setCanEdit(false)
          return
        }

        setCanEdit(true)

        const targetUserData = await getUserById(userId)
        
        if (!targetUserData) {
          const errorMsg = 'User not found'
          setError(errorMsg)
          showToast(errorMsg, 'error')
          throw new Error(errorMsg)
        }

        setUser(targetUserData)
        
        const initialForm = {
          firstName: targetUserData.firstName || '',
          lastName: targetUserData.lastName || '',
          number: targetUserData.number || '',
          address: targetUserData.address || '',
          gender: targetUserData.gender || '',
          imageUrl: targetUserData.imageUrl || ''
        }
        
        setEditForm(initialForm)
        
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId, supabase, router, showToast])

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
    if (!hasChanges) {
      setHasChanges(true)
      showToast('You have unsaved changes', 'warning')
    }
  }

  const handleSaveChanges = async () => {
    if (!user || !canEdit) return

    try {
      setIsUpdating(true)
      setError(null)
      
      const updatedUser = await updateUser(user.id, editForm)
      setUser(updatedUser)
      setHasChanges(false)
      showToast('Profile updated successfully!', 'success')
      
      router.push(`/profile/${userId}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDiscardChanges = () => {
    if (!user) return
    
    const originalForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      number: user.number || '',
      address: user.address || '',
      gender: user.gender || '',
      imageUrl: user.imageUrl || ''
    }
    
    setEditForm(originalForm)
    setHasChanges(false)
    setError(null)
    showToast('Changes discarded', 'info')
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const getUserDisplayName = (): string => {
    return [editForm.firstName, editForm.lastName].filter(Boolean).join(' ') || 'User'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400} />
      </div>
    )
  }

  if (error && !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => router.push(`/profile/${userId}`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-2">You don't have permission to edit this profile.</p>
          <button
            onClick={() => router.push(`/profile/${userId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isManager = currentUser?.role?.toLowerCase() === 'manager'

  return (
    <div className='w-screen h-full bg-bg p-8 flex gap-8'>
      <div className='w-[20%] h-[calc(100vh-4rem)] bg-white rounded-xl flex flex-col items-center p-8 gap-4 sticky top-8'>
        <div className='flex flex-col items-center gap-2'>
          <div className="w-40 h-40 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative group cursor-pointer"
            onClick={triggerFileInput}
          >
            <Image
              src={editForm.imageUrl || Placeholder}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover rounded-full"
              priority
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : (
                <CameraAltIcon className="text-white text-3xl" />
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className='font-semibold text-text text-2xl'>{getUserDisplayName()}</div>
          <div className='font-semibold text-stext'>{user.role || 'Care Worker'}</div>
        </div>
        
        <div className='flex items-center gap-3 bg-[#47f2ca80] py-2 px-3 rounded-xl w-full cursor-pointer'>
          <PersonIcon />
          <span className='font-semibold'>Edit Profile</span>
        </div>
        
        <div className='flex items-center gap-3 py-2 px-3 rounded-xl w-full cursor-pointer'
          onClick={() => router.push('/')}
        >
          <HomeFilledIcon sx={{ fontSize: 20 }} />
          <span className='font-semibold'>Back To Home</span>
        </div>
        
        {isManager && (
          <>
            <div className='flex items-center gap-3 py-2 px-3 rounded-xl w-full cursor-pointer'
              onClick={() => router.push('/manager/dashboard')}
            >
              <SpaceDashboardIcon />
              <span className='font-semibold'>Dashboard</span>
            </div>
            <div className='flex items-center gap-3 py-2 px-3 rounded-xl w-full cursor-pointer'
              onClick={() => router.push('/manager/location')}
            >
              <EditLocationAltIcon/>
              <span className='font-semibold'>Office Location</span>
            </div>
          </>
        )}
      </div>
      
      <div className='w-[80%] bg-white rounded-xl p-8 gap-6 overflow-y-auto scrollbar-hide'>
          <div className='font-semibold text-xl text-text mb-6'>Edit Personal Information</div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}

          <div className='grid grid-cols-2 gap-6'>
            <div className='flex flex-col gap-2'>
              <label className='font-semibold text-gray-600'>First Name</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                placeholder="Enter first name"
              />
            </div>
            
            <div className='flex flex-col gap-2'>
              <label className='font-semibold text-gray-600'>Last Name</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                placeholder="Enter last name"
              />
            </div>

            <div className='flex flex-col gap-2'>
              <label className='font-semibold text-gray-600'>Gender</label>
              <div className='flex gap-4 p-3 border-2 border-gray-200 rounded-lg'>
                {['Male', 'Female', 'Other'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={editForm.gender === option}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              <label className='font-semibold text-gray-600'>Phone Number</label>
              <input
                type="tel"
                value={editForm.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors'
                placeholder="Enter phone number"
              />
            </div>

            <div className='flex flex-col gap-2 col-span-2'>
              <label className='font-semibold text-gray-600'>Address</label>
              <textarea
                value={editForm.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none'
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className='flex gap-4 pt-4 border-t border-gray-200'>
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isUpdating || isUploading}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                hasChanges && !isUpdating && !isUploading
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUpdating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              onClick={handleDiscardChanges}
              disabled={!hasChanges || isUpdating}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                hasChanges && !isUpdating
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Discard Changes
            </button>
          </div>
        </div>
    </div>
  )
}

export default EditProfilePage