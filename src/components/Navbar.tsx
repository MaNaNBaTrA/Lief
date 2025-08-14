'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { LogOut, UserRoundCheck, User, Clock} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useToast } from '@/context/ToastContext' 

interface UserProfile {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
    totalWorkingHours?: string | null
}

interface OfficeLocation {
    id: string
    name: string
    latitude: number
    longitude: number
}

interface Attendance {
    userId: string
    checkInTime?: string | null
    checkOutTime?: string | null
    checkInNote?: string | null
    checkOutNote?: string | null
    date: string
    isHoliday: boolean
    totalHoursWorked?: string
    overtime?: string
    negativeWorkingHours?: string
}

interface GraphQLResponse {
    data?: {
        getUserById?: UserProfile | null
        getAttendance?: Attendance | null
        createAttendance?: Attendance
        updateAttendance?: Attendance
        getAllOfficeLocations?: OfficeLocation[]
    }
    errors?: Array<{
        message: string
        locations?: Array<{ line: number; column: number }>
        path?: string[]
    }>
}

const DEFAULT_TIMEZONE = 'Asia/Kolkata'
const ALLOWED_DISTANCE_KM = 2

const Navbar: React.FC = () => {
    const router = useRouter()
    const { showToast } = useToast()
    const [showPopup, setShowPopup] = useState<boolean>(false)
    const [note, setNote] = useState<string>('')
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false)
    const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null)
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false)
    const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([])
    const [currentOffice, setCurrentOffice] = useState<OfficeLocation | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'))
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => {
                    let errorMessage = 'Unable to get location'
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user'
                            break
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable'
                            break
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out'
                            break
                    }
                    reject(new Error(errorMessage))
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            )
        })
    }

    const fetchOfficeLocations = async (): Promise<void> => {
        try {
            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                    query GetAllOfficeLocations {
                        getAllOfficeLocations {
                            id
                            name
                            latitude
                            longitude
                        }
                    }
                `
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result: GraphQLResponse = await response.json()

            if (result.errors) {
                console.error('GraphQL errors:', result.errors)
                showToast('Failed to fetch office locations', 'error')
                return
            }

            if (result.data?.getAllOfficeLocations) {
                const offices = result.data.getAllOfficeLocations
                setOfficeLocations(offices)
                if (offices.length > 0) {
                    setCurrentOffice(offices[0])
                } else {
                    showToast('No office locations configured', 'warning')
                }
            }
        } catch (error) {
            console.error('Error fetching office locations:', error)
            showToast('Failed to fetch office locations', 'error')
        }
    }

    const initializeLocation = async (): Promise<void> => {
        setIsLocationLoading(true)

        try {
            await fetchOfficeLocations()
            const location = await getCurrentLocation()
            setCurrentLocation(location)
        } catch (error) {
            showToast((error as Error).message, 'error')
        } finally {
            setIsLocationLoading(false)
        }
    }

    const isWithinPerimeter = async (): Promise<boolean> => {
        setIsLocationLoading(true)

        try {
            const location = await getCurrentLocation()
            setCurrentLocation(location)

            if (officeLocations.length === 0) {
                showToast('No office locations configured', 'error')
                return false
            }

            let nearestOffice = officeLocations[0]
            let nearestDistance = calculateDistance(
                location.lat,
                location.lng,
                nearestOffice.latitude,
                nearestOffice.longitude
            )

            for (const office of officeLocations) {
                const distance = calculateDistance(
                    location.lat,
                    location.lng,
                    office.latitude,
                    office.longitude
                )

                if (distance <= ALLOWED_DISTANCE_KM) {
                    setCurrentOffice(office)
                    return true
                }

                if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearestOffice = office
                }
            }

            showToast(`You are ${nearestDistance.toFixed(2)}km away from ${nearestOffice.name}. Check-in requires being within ${ALLOWED_DISTANCE_KM}km of any office.`, 'warning')
            return false
        } catch (error) {
            showToast((error as Error).message, 'error')
            return false
        } finally {
            setIsLocationLoading(false)
        }
    }

    const getTodayDateString = (): string => {
        const today = new Date()
        const localDate = new Date(today.toLocaleString("en-US", { timeZone: DEFAULT_TIMEZONE }))
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthName = monthNames[localDate.getMonth()]
        const dayNumber = localDate.getDate()
        return `${monthName} ${dayNumber}`
    }

    const getCurrentTimeForStorage = (): string => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const date = now.getDate()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        const seconds = now.getSeconds()
        const localAsUTC = new Date(Date.UTC(year, month, date, hours, minutes, seconds))
        return localAsUTC.toISOString()
    }

    const getCurrentTimeForDisplay = (): string => {
        return new Date().toLocaleString("en-US", {
            timeZone: DEFAULT_TIMEZONE,
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    // const formatTimeForDisplay = (utcTime: string): string => {
    //     if (!utcTime) return ''
    //     const date = new Date(utcTime)
    //     return date.toLocaleString("en-US", {
    //         timeZone: DEFAULT_TIMEZONE,
    //         year: 'numeric',
    //         month: 'short',
    //         day: '2-digit',
    //         hour: '2-digit',
    //         minute: '2-digit',
    //         second: '2-digit'
    //     })
    // }

    const calculateHoursWorked = (checkInTime: string, checkOutTime?: string): number => {
        try {
            if (!checkInTime || typeof checkInTime !== 'string' || checkInTime.trim() === '') {
                return 0
            }

            const checkIn = new Date(checkInTime)
            const checkOut = checkOutTime ? new Date(checkOutTime) : new Date()

            if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                return 0
            }

            const diffMs = checkOut.getTime() - checkIn.getTime()
            const hours = diffMs / (1000 * 60 * 60)
            return Math.max(0, hours)
        } catch (error) {
            return 0
        }
    }

    const formatHoursToTime = (hours: number): string => {
        if (!hours || isNaN(hours) || hours <= 0) {
            return "0h 0m 0s"
        }

        const totalSeconds = Math.floor(Math.abs(hours) * 3600)
        const hrs = Math.floor(totalSeconds / 3600)
        const mins = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60

        return `${hrs}h ${mins}m ${secs}s`
    }

    const updateWorkingHours = async () => {
        if (!isCheckedIn || !currentAttendance || !user || !currentAttendance.checkInTime) {
            return
        }

        try {
            const totalHours = calculateHoursWorked(currentAttendance.checkInTime)
            const totalHoursFormatted = formatHoursToTime(totalHours)

            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdateAttendance($userId: String!, $date: String!, $data: UpdateAttendanceInput!) {
                            updateAttendance(userId: $userId, date: $date, data: $data) {
                                userId
                                totalHoursWorked
                                checkInTime
                                checkOutTime
                            }
                        }
                    `,
                    variables: {
                        userId: user.id,
                        date: currentAttendance.date,
                        data: {
                            totalHoursWorked: totalHoursFormatted
                        }
                    }
                })
            })

            if (response.ok) {
                const result: GraphQLResponse = await response.json()
                if (!result.errors && result.data?.updateAttendance) {
                    const updatedAttendance = result.data.updateAttendance
                    setCurrentAttendance(prev => prev ? {
                        ...prev,
                        totalHoursWorked: updatedAttendance.totalHoursWorked || "0h 0m 0s"
                    } : null)
                }
            }
        } catch (error) {
            console.error('Error updating working hours:', error)
        }
    }

    const startWorkingHoursInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
        intervalRef.current = setInterval(updateWorkingHours, 10 * 60 * 1000)
    }

    const stopWorkingHoursInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const checkTodayAttendance = async (userId: string): Promise<void> => {
        try {
            const todayDate = getTodayDateString()

            const response = await fetch('/api/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        query GetAttendance($userId: String!, $date: String!) {
                            getAttendance(userId: $userId, date: $date) {
                                userId
                                checkInTime
                                checkOutTime
                                checkInNote
                                checkOutNote
                                date
                                isHoliday
                                totalHoursWorked
                                overtime
                                negativeWorkingHours
                            }
                        }
                    `,
                    variables: {
                        userId: userId,
                        date: todayDate
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result: GraphQLResponse = await response.json()

            if (result.errors) {
                console.error('GraphQL errors:', result.errors)
                showToast('Failed to check attendance status', 'error')
                return
            }

            if (result.data?.getAttendance) {
                const attendance = result.data.getAttendance
                setCurrentAttendance(attendance)

                if (attendance.checkInTime && !attendance.checkOutTime) {
                    setIsCheckedIn(true)
                    startWorkingHoursInterval()
                } else {
                    setIsCheckedIn(false)
                }
            }
        } catch (error) {
            console.error('Error checking today\'s attendance:', error)
            showToast('Failed to check attendance status', 'error')
        }
    }

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
                                totalWorkingHours
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

            if (!result.errors && result.data?.getUserById) {
                setUserProfile(result.data.getUserById)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            showToast('Failed to load user profile', 'error')
        }
    }

    const handleCheckIn = async (): Promise<void> => {
        if (isCheckedIn) {
            setShowPopup(true)
            return
        }

        if (currentAttendance && currentAttendance.checkOutTime) {
            showToast('You have already checked out for today', 'info')
            return
        }

        const withinPerimeter = await isWithinPerimeter()

        if (!withinPerimeter) {
            return 
        }

        setShowPopup(true)
    }

    const handlePopupSubmit = async (): Promise<void> => {
        if (!user || !userProfile) return

        try {
            const todayDate = getTodayDateString()
            const currentTime = getCurrentTimeForStorage()

            if (isCheckedIn) {
                if (!currentAttendance) return

                const response = await fetch('/api/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `
                            mutation UpdateAttendance($userId: String!, $date: String!, $data: UpdateAttendanceInput!) {
                                updateAttendance(userId: $userId, date: $date, data: $data) {
                                    userId
                                    checkOutTime
                                    checkOutNote
                                    totalHoursWorked
                                    overtime
                                    negativeWorkingHours
                                }
                            }
                        `,
                        variables: {
                            userId: user.id,
                            date: todayDate,
                            data: {
                                checkOutTime: currentTime,
                                checkOutNote: note || null,
                                userLatitude: currentLocation?.lat,
                                userLongitude: currentLocation?.lng
                            }
                        }
                    })
                })

                const result: GraphQLResponse = await response.json()

                if (result.errors) {
                    showToast('Failed to check out. Please try again.', 'error')
                    return
                }

                if (result.data?.updateAttendance) {
                    setCurrentAttendance(prev => prev ? {
                        ...prev,
                        ...result.data!.updateAttendance!
                    } : null)
                    setIsCheckedIn(false)
                    stopWorkingHoursInterval()
                    showToast('Successfully checked out!', 'success')
                }
            } else {
                const response = await fetch('/api/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `
                            mutation CreateAttendance($data: CreateAttendanceInput!) {
                                createAttendance(data: $data) {
                                    userId
                                    checkInTime
                                    checkInNote
                                    date
                                    totalHoursWorked
                                    overtime
                                    negativeWorkingHours
                                }
                            }
                        `,
                        variables: {
                            data: {
                                userId: user.id,
                                checkInTime: currentTime,
                                checkInNote: note || null,
                                date: todayDate,
                                isHoliday: false,
                                totalHoursWorked: "0h 0m 0s",
                                overtime: "0h 0m 0s",
                                negativeWorkingHours: "0h 0m 0s",
                                userLatitude: currentLocation?.lat,
                                userLongitude: currentLocation?.lng
                            }
                        }
                    })
                })

                const result: GraphQLResponse = await response.json()

                if (result.errors) {
                    showToast('Failed to check in. Please try again.', 'error')
                    return
                }

                if (result.data?.createAttendance) {
                    setCurrentAttendance(result.data.createAttendance)
                    setIsCheckedIn(true)
                    startWorkingHoursInterval()
                    showToast('Successfully checked in!', 'success')
                }
            }

            setShowPopup(false)
            setNote('')
        } catch (error) {
            console.error('Error:', error)
            showToast('An unexpected error occurred. Please try again.', 'error')
        }
    }

    const handleLogout = async (): Promise<void> => {
        stopWorkingHoursInterval()
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error.message)
            showToast('Failed to log out. Please try again.', 'error')
            return
        }
        showToast('Successfully logged out!', 'success')
        router.replace('/signin')
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

    const getButtonText = (): string => {
        return isCheckedIn ? 'Check Out' : 'Check In'
    }

    const getButtonIcon = () => {
        return isCheckedIn ? <Clock color="#ffffff" size={22} strokeWidth={1.7} /> : <UserRoundCheck color="#ffffff" size={22} strokeWidth={1.7} />
    }

    const getButtonStyle = (): string => {
        return isCheckedIn
            ? "bg-red-600 font-semibold text-white flex items-center py-3 px-6 gap-2 rounded-lg hover:bg-red-700 cursor-pointer transition-colors duration-200"
            : "bg-brand font-semibold text-white flex items-center py-3 px-6 gap-2 rounded-lg hover:bg-brand/90 cursor-pointer transition-colors duration-200"
    }

    const canPerformAction = (): boolean => {
        if (currentAttendance && currentAttendance.checkOutTime) {
            return false
        }
        return true
    }

    useEffect(() => {
        const getCurrentUser = async (): Promise<void> => {
            try {
                await initializeLocation()

                const { data: { user }, error } = await supabase.auth.getUser()
                if (error) {
                    console.error('Error getting user:', error.message)
                    showToast('Failed to load user information', 'error')
                    return
                }

                if (user) {
                    setUser(user)
                    await fetchUserProfile(user.id)
                    await checkTodayAttendance(user.id)
                }
            } catch (error) {
                console.error('Error:', error)
                showToast('Failed to initialize application', 'error')
            } finally {
                setLoading(false)
            }
        }

        getCurrentUser()

        return () => {
            stopWorkingHoursInterval()
        }
    }, [])

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
                    onClick={() => router.push('/manager/dashboard')}
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
                    disabled={!canPerformAction() || isLocationLoading}
                    className={`${getButtonStyle()} ${(!canPerformAction() || isLocationLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLocationLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Getting Location...
                        </>
                    ) : (
                        <>
                            {getButtonIcon()}
                            {getButtonText()}
                        </>
                    )}
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
                        <h2 className="text-lg font-semibold mb-4">
                            {isCheckedIn ? 'Check Out Note' : 'Check In Note'} (Optional)
                        </h2>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                                <strong>Current Local Time:</strong><br />
                                {getCurrentTimeForDisplay()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                <strong>Date:</strong> {getTodayDateString()}
                            </p>
                            {currentLocation && currentOffice && (
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Office:</strong> {currentOffice.name}
                                    <br />
                                    <span className="text-green-600">
                                        ✓ Within {currentOffice.name} perimeter ({calculateDistance(currentLocation.lat, currentLocation.lng, currentOffice.latitude, currentOffice.longitude).toFixed(2)}km)
                                    </span>
                                </p>
                            )}
                        </div>

                        <textarea
                            value={note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                            placeholder={`Optional ${isCheckedIn ? 'check-out' : 'check-in'} note...`}
                            className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none"
                            rows={4}
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPopup(false)
                                    setNote('')
                                }}
                                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePopupSubmit}
                                className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${isCheckedIn
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-brand hover:bg-brand/90'
                                    }`}
                            >
                                {isCheckedIn ? 'Check Out' : 'Check In'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar