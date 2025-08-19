import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import Work from './Work'

interface AttendanceRecord {
  userId: string
  checkInTime?: string
  checkOutTime?: string
  checkInNote?: string
  checkOutNote?: string
  overtime: string
  negativeWorkingHours: string
  totalHoursWorked: string
  date: string
  isHoliday: boolean
  createdAt: string
  updatedAt: string
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

interface GetAttendanceResponse {
  getAttendancesByUser: AttendanceRecord[]
}

const Analytics: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [todayHours, setTodayHours] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getTodayAttendance = async (userId: string): Promise<number> => {
    try {
      const today = new Date()
      const todayString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric'
      }).format(today)


      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetAttendancesByUser($userId: String!) {
              getAttendancesByUser(userId: $userId) {
                userId
                checkInTime
                checkOutTime
                totalHoursWorked
                date
                isHoliday
                createdAt
                updatedAt
              }
            }
          `,
          variables: { userId },
        }),
      })


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: GraphQLResponse<GetAttendanceResponse> = await response.json()

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors)
        throw new Error(result.errors[0].message || 'GraphQL error occurred')
      }

      if (!result.data?.getAttendancesByUser) {
        return 0
      }


      const todayRecords = result.data.getAttendancesByUser.filter(record => {
        return record.date === todayString
      })


      if (todayRecords.length === 0) {
        return 0
      }

      let totalHours = 0
      todayRecords.forEach(record => {
        if (record.totalHoursWorked) {
          const parsedHours = parseTimeStringToHours(record.totalHoursWorked)
          totalHours += parsedHours
        }
      })

      return totalHours
    } catch (err) {
      console.error('Error in getTodayAttendance:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance'
      throw new Error(errorMessage)
    }
  }

  const parseTimeStringToHours = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0

    try {
      const hoursMatch = timeStr.match(/(\d+)h/)
      const minsMatch = timeStr.match(/(\d+)m(?:in)?/)
      const secsMatch = timeStr.match(/(\d+)s(?:ec)?/)

      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
      const mins = minsMatch ? parseInt(minsMatch[1]) : 0
      const secs = secsMatch ? parseInt(secsMatch[1]) : 0

      const totalHours = hours + (mins / 60) + (secs / 3600)
      return isNaN(totalHours) ? 0 : totalHours
    } catch (error) {
      console.error('Error parsing time string:', error)
      return 0
    }
  }

  const formatHours = (hours: number): string => {
    if (hours === 0) return '0h 0m 0s'

    const wholeHours = Math.floor(hours)
    const remainingMinutes = (hours - wholeHours) * 60
    const wholeMinutes = Math.floor(remainingMinutes)
    const seconds = Math.round((remainingMinutes - wholeMinutes) * 60)

    const parts = []

    if (wholeHours > 0) {
      parts.push(`${wholeHours}h`)
    }
    if (wholeMinutes > 0) {
      parts.push(`${wholeMinutes}m`)
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}s`)
    }

    return parts.join(' ')
  }

  useEffect(() => {
    const fetchTodayHours = async () => {
      if (authLoading) {
        return
      }

      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const hours = await getTodayAttendance(user.id)
        setTodayHours(hours)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch today\'s hours'
        setError(errorMessage)
        console.error('Error fetching today\'s hours:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayHours()
  }, [user?.id, authLoading])

  if (authLoading) {
    return (
      <div className='w-full bg-white rounded-xl items-center p-6 flex justify-between h-fit'>
        <div>
          <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
          <div className='text-xs font-medium text-stext'>Checking authentication...</div>
        </div>
        <div className='text-2xl text-text font-semibold'>
          <div className="animate-pulse bg-gray-200 rounded w-16 h-8"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='w-full bg-white rounded-xl items-center p-6 flex justify-between h-fit'>
        <div>
          <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
          <div className='text-xs font-medium text-stext'>Please sign in to view your work hours</div>
        </div>
        <div className='text-2xl text-text font-semibold'>--</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='w-full bg-white rounded-xl items-center p-6 flex justify-between h-fit'>
        <div>
          <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
          <div className='text-xs font-medium text-stext'>Loading...</div>
        </div>
        <div className='text-2xl text-text font-semibold'>
          <div className="animate-pulse bg-gray-200 rounded w-16 h-8"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='w-full bg-white rounded-xl items-center p-6 flex flex-col gap-2 h-fit'>
        <div className='w-full flex justify-between items-start'>
          <div>
            <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
            <div className='text-xs font-medium text-red-500'>Error: {error}</div>
          </div>
          <div className='text-2xl text-red-500 font-semibold'>--</div>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full bg-white rounded-xl items-center p-6 flex flex-col gap-2 h-full shadow-lg'>
      <div className='w-full flex justify-between items-center'>
        <div>
          <div className='text-text text-lg font-semibold mb-2'>Today's Work Duration</div>
          <div className='text-xs font-medium text-stext'>
            {todayHours > 0 ? 'Cumulative work hours logged' : 'No work logged today'}
          </div>
        </div>
        <div className='text-2xl text-text font-semibold'>
          {formatHours(todayHours)}
        </div>
      </div>
      <Work/>
    
    </div>
  )
}

export default Analytics;