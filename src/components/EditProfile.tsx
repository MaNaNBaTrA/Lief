'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Loader from '@/components/LottieLoader'
import Placeholder from '../../public/Images/Profile-Placeholder.png'
import { User, Edit, Home, LayoutDashboard, MapPin, Menu, X, Camera } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        setError(null)
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          throw new Error('Authentication error: ' + authError.message)
        }

        if (!authUser) {
          router.push('/login') 
          return
        }

        const currentUserData = await getUserById(authUser.id)
        
        if (!currentUserData) {
          throw new Error('Current user not found in database')
        }

        setCurrentUser(currentUserData)

        const hasEditAccess = checkEditAccess(currentUserData, userId)
        
        if (!hasEditAccess) {
          setError('Access denied. You can only edit profiles you have permission to modify.')
          setCanEdit(false)
          return
        }

        setCanEdit(true)

        const targetUserData = await getUserById(userId)
        
        if (!targetUserData) {
          throw new Error('User not found')
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
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId, supabase, router, showToast])

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
      
      // Small delay to show success message before navigating
      setTimeout(() => {
        router.push(`/profile/${userId}`)
      }, 1000)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400} />
      </div>
    )
  }

  if (error && !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md w-full">
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
    <div className='min-h-screen bg-bg'>
      <header className="lg:hidden flex items-center py-2 px-4 justify-between bg-bg border-b-2 border-border sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 relative">
            <Image
              src={editForm.imageUrl || Placeholder}
              alt="Profile"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-text">{getUserDisplayName()}</h1>
            <p className="text-sm text-gray-500">Edit Profile</p>
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
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 relative">
                <Image
                  src={editForm.imageUrl || Placeholder}
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
                <Edit size={16} className="text-text" strokeWidth={1.7} />
                <span className='font-medium text-sm'>Edit Profile</span>
              </div>

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

      <div className="lg:flex lg:gap-8 lg:p-8 lg:h-screen">
        <div className="hidden lg:flex lg:w-80 bg-white rounded-xl flex-col p-8 h-full">
          <div className='flex flex-col items-center gap-4 mb-8'>
            <div className="w-40 h-40 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative border-2 border-gray-200 group cursor-pointer"
              onClick={triggerFileInput}
            >
              <Image
                src={editForm.imageUrl || Placeholder}
                alt="Profile"
                width={160}
                height={160}
                className="w-full h-full object-cover rounded-full"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <Camera size={32} className="text-white" />
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
            <div className='font-semibold text-text text-2xl text-center'>{getUserDisplayName()}</div>
            <div className='font-semibold text-stext text-center mb-4'>{user.role || 'Care Worker'}</div>
          </div>

          <div className="w-full space-y-4">
            <div className='flex items-center gap-3 bg-[#47f2ca80] py-3 px-4 rounded-xl w-full'>
              <Edit size={20} strokeWidth={1.7} />
              <span className='font-semibold'>Edit Profile</span>
            </div>
            
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

        <div className='flex-1 p-4 lg:p-0 min-h-screen lg:min-h-0 lg:h-full'>
          <div className='bg-white rounded-xl p-4 lg:p-8 flex flex-col gap-6 h-full'>
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center relative border-2 border-gray-200 group cursor-pointer"
                onClick={triggerFileInput}
              >
                <Image
                  src={editForm.imageUrl || Placeholder}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <Camera size={24} className="text-white" />
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
            </div>

            <div className='flex-1 overflow-y-auto'>
              <div className='font-semibold text-xl lg:text-2xl text-text mb-6'>Edit Personal Information</div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                  <p className="text-sm lg:text-base">{error}</p>
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6'>
                <div className='flex flex-col gap-2'>
                  <label className='font-semibold text-gray-600 text-sm lg:text-base'>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base'
                    placeholder="Enter first name"
                  />
                </div>
                
                <div className='flex flex-col gap-2'>
                  <label className='font-semibold text-gray-600 text-sm lg:text-base'>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base'
                    placeholder="Enter last name"
                  />
                </div>

                <div className='flex flex-col gap-2 sm:col-span-2'>
                  <label className='font-semibold text-gray-600 text-sm lg:text-base'>Gender</label>
                  <div className='flex flex-wrap gap-4 p-3 border-2 border-gray-200 rounded-lg'>
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
                        <span className="ml-2 text-gray-700 text-sm lg:text-base">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='font-semibold text-gray-600 text-sm lg:text-base'>Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm lg:text-base'
                    placeholder="Enter phone number"
                  />
                </div>

                <div className='flex flex-col gap-2 sm:col-span-2'>
                  <label className='font-semibold text-gray-600 text-sm lg:text-base'>Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className='text-text p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm lg:text-base'
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 mt-auto'>
              <button
                onClick={handleSaveChanges}
                disabled={!hasChanges || isUpdating || isUploading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm lg:text-base ${
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
                className={`px-6 py-3 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
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
      </div>
    </div>
  )
}

export default EditProfilePage