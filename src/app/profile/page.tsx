'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

const UserProfilePage : React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
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
      setError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const imageUrl = await uploadToCloudinary(file)
      
      setEditForm(prev => ({ ...prev, imageUrl }))

      if (user) {
        const updatedUser = await updateUser(user.id, { imageUrl })
        setUser(updatedUser)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
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
        throw new Error(result.errors[0].message)
      }

      return result.data.updateUser
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user')
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

        setAuthUser(authUser)

        const userData = await getUserById(authUser.id)
        
        if (!userData) {
          throw new Error('User not found in database')
        }

        setUser(userData)
        
        setEditForm({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          number: userData.number || '',
          address: userData.address || '',
          gender: userData.gender || '',
          imageUrl: userData.imageUrl || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setIsUpdating(true)
      const updatedUser = await updateUser(user.id, editForm)
      setUser(updatedUser)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        number: user.number || '',
        address: user.address || '',
        gender: user.gender || '',
        imageUrl: user.imageUrl || ''
      })
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">User not found</h2>
          <p className="text-gray-500 mt-2">The requested user could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-6">
              
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                
                
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="absolute inset-0 w-24 h-24 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>

                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
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
              </div>
            </div>
          </div>

          
          <div className="px-6 py-8">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.number}
                        onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={editForm.gender === 'Male'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Male</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={editForm.gender === 'Female'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Female</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value="Other"
                            checked={editForm.gender === 'Other'}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Other</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email (Read-only)</label>
                    <p className="mt-1 text-lg text-gray-600 bg-gray-50 p-2 rounded">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role (Read-only)</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                        {user.role || 'Care Worker'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Working Hours (Read-only)</label>
                    <p className="mt-1 text-lg text-gray-600 bg-gray-50 p-2 rounded">
                      {user.totalWorkingHours ? `${user.totalWorkingHours} hours/day` : 'Not set'}
                    </p>
                  </div>
                </div>

                
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUpdating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    disabled={isUpdating}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              
              <>
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
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage