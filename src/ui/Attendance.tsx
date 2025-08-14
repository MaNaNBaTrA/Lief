'use client'

import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  TablePagination,
  Card,
  CardContent,
  Collapse
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Work,
  EventBusy,
  ExpandMore,
  ExpandLess,
  Info
} from '@mui/icons-material'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Attendance {
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
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    role?: string
  }
}

interface UserAttendanceTableProps {
  userId?: string 
  showAllUsers?: boolean 
  dateFilter?: string
  maxRows?: number 
}

const UserAttendanceTable: React.FC<UserAttendanceTableProps> = ({
  userId,
  showAllUsers = false,
  dateFilter,
  maxRows = 10
}) => {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(maxRows)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  const supabase = createClientComponentClient()

  const GET_USER_ATTENDANCES = `
    query GetAttendancesByUser($userId: String!) {
      getAttendancesByUser(userId: $userId) {
        userId
        checkInTime
        checkOutTime
        checkInNote
        checkOutNote
        overtime
        negativeWorkingHours
        totalHoursWorked
        date
        isHoliday
        createdAt
        updatedAt
        user {
          id
          firstName
          lastName
          email
          role
        }
      }
    }
  `

  const GET_ALL_ATTENDANCES_BY_DATE = `
    query GetAttendancesByDate($date: String!) {
      getAttendancesByDate(date: $date) {
        userId
        checkInTime
        checkOutTime
        checkInNote
        checkOutNote
        overtime
        negativeWorkingHours
        totalHoursWorked
        date
        isHoliday
        createdAt
        updatedAt
        user {
          id
          firstName
          lastName
          email
          role
        }
      }
    }
  `

  const fetchAttendances = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        throw new Error('Authentication required')
      }

      setCurrentUser(authUser)

      let query: string = ''
      let variables: Record<string, any> = {}
      let targetUserId: string = ''

      console.log('Component props:', { userId, showAllUsers, dateFilter })
      console.log('Current authenticated user:', authUser.id)

      if (showAllUsers && dateFilter) {
        console.log('Fetching all users attendance for date:', dateFilter)
        query = GET_ALL_ATTENDANCES_BY_DATE
        variables = { date: dateFilter }
      } else {
        if (userId && userId.trim() !== '') {
          targetUserId = userId.trim()
          console.log('Using provided userId (PRIORITY):', targetUserId)
        } else {
          targetUserId = authUser.id
          console.log('Using authenticated user ID (FALLBACK):', targetUserId)
        }

        console.log('Final targetUserId selected:', targetUserId)
        query = GET_USER_ATTENDANCES
        variables = { userId: targetUserId }
      }

      console.log('GraphQL Query:', query)
      console.log('Variables:', variables)

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('GraphQL Response:', result)

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error occurred')
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query')
      }

      const data = showAllUsers && dateFilter 
        ? result.data.getAttendancesByDate 
        : result.data.getAttendancesByUser

      console.log('Processed attendance data:', data)
      
      let filteredData = data || []
      if (userId && userId.trim() !== '' && !showAllUsers) {
        filteredData = filteredData.filter((attendance: Attendance) => 
          attendance.userId === userId.trim()
        )
        console.log('Filtered data for userId:', userId, filteredData)
      }

      setAttendances(filteredData)
    } catch (error) {
      console.error('Error fetching attendances:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendances'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('Component props changed:', { userId, showAllUsers, dateFilter })
    console.log('userId type and value:', typeof userId, userId)
    
    const timeoutId = setTimeout(() => {
      fetchAttendances()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [userId, showAllUsers, dateFilter])

  useEffect(() => {
    console.log('Attendance data received:', attendances)
    if (attendances.length > 0) {
      console.log('First attendance record:', attendances[0])
      console.log('User IDs in attendance data:', attendances.map(a => a.userId))
      console.log('Expected userId:', userId)
      console.log('checkInTime:', attendances[0].checkInTime, 'Type:', typeof attendances[0].checkInTime)
      console.log('checkOutTime:', attendances[0].checkOutTime, 'Type:', typeof attendances[0].checkOutTime)
    }
  }, [attendances, userId])

  const formatDateTime = (dateTime?: string | null): string => {
    if (!dateTime || typeof dateTime !== 'string') return 'N/A'
    try {
      let date: Date
      
      if (/^\d+$/.test(dateTime.toString().trim())) {
        const timestamp = parseInt(dateTime.toString())
        date = new Date(timestamp)
      } else {
        let isoString = dateTime
        if (dateTime.includes(' ') && !dateTime.includes('T')) {
          isoString = dateTime.replace(' ', 'T') + 'Z'
        }
        
        date = new Date(isoString)
        if (isNaN(date.getTime())) {
          const fallbackDate = new Date(dateTime)
          if (isNaN(fallbackDate.getTime())) return 'N/A'
          date = fallbackDate
        }
      }
      
      if (isNaN(date.getTime())) return 'N/A'
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.log('Date parsing error:', error, 'for value:', dateTime)
      return 'N/A'
    }
  }

  const formatTime = (dateTime?: string | null): string => {
    console.log('Formatting time for:', dateTime, 'Type:', typeof dateTime)
    
    if (!dateTime || dateTime === null || dateTime === undefined || typeof dateTime !== 'string') {
      console.log('No valid dateTime provided')
      return 'N/A'
    }
    
    try {
      let date: Date
      
      if (/^\d+$/.test(dateTime.toString().trim())) {
        console.log('Detected Unix timestamp:', dateTime)
        const timestamp = parseInt(dateTime.toString())
        
        const utcDate = new Date(timestamp)
        console.log('UTC Date from timestamp (this is actually India time):', utcDate.toISOString())
        
        const hours = utcDate.getUTCHours()
        const minutes = utcDate.getUTCMinutes()
        
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        const formattedTime = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
        
        console.log('Manually formatted time (treating timestamp as India time):', formattedTime)
        return formattedTime
        
      } else {
        let dateToProcess = dateTime.toString().trim()
        
        date = new Date(dateToProcess)
        
        if (isNaN(date.getTime()) && dateToProcess.includes(' ')) {
          const isoString = dateToProcess.replace(' ', 'T')
          date = new Date(isoString)
        }
        
        if (isNaN(date.getTime()) && dateToProcess.includes(' ')) {
          const isoString = dateToProcess.replace(' ', 'T') + 'Z'
          date = new Date(isoString)
        }
        
        if (isNaN(date.getTime())) {
          return 'N/A'
        }
        
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        
        return formattedTime
      }
      
    } catch (error) {
      console.log('Date parsing error:', error, 'for value:', dateTime)
      return 'N/A'
    }
  }

  const getStatusChip = (attendance: Attendance): React.ReactElement => {
    if (attendance.isHoliday) {
      return <Chip icon={<EventBusy />} label="Holiday" color="warning" size="small" />
    }
    
    if (attendance.checkInTime && attendance.checkOutTime) {
      return <Chip icon={<CheckCircle />} label="Complete" color="success" size="small" />
    }
    
    if (attendance.checkInTime && !attendance.checkOutTime) {
      return <Chip icon={<AccessTime />} label="Checked In" color="primary" size="small" />
    }
    
    return <Chip icon={<Cancel />} label="Absent" color="error" size="small" />
  }

  const getOvertimeChip = (overtime: string, negativeHours: string): React.ReactElement => {
    const isOvertime = overtime !== "0h 0m 0s" && overtime !== "0"
    const isNegative = negativeHours !== "0h 0m 0s" && negativeHours !== "0"
    
    if (isOvertime) {
      return <Chip label={`+${overtime}`} color="success" size="small" variant="outlined" />
    }
    
    if (isNegative) {
      return <Chip label={`-${negativeHours}`} color="error" size="small" variant="outlined" />
    }
    
    return <Chip label="On Time" color="default" size="small" variant="outlined" />
  }

  const toggleRowExpansion = (attendanceId: string): void => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(attendanceId)) {
      newExpanded.delete(attendanceId)
    } else {
      newExpanded.add(attendanceId)
    }
    setExpandedRows(newExpanded)
  }

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading attendance data...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6">Error loading attendance data</Typography>
        <Typography variant="body2">{error}</Typography>
      </Alert>
    )
  }

  if (attendances.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Work sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No attendance records found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {showAllUsers 
                ? 'No attendance records exist for the selected date.'
                : userId 
                  ? `No attendance records found for user ID: ${userId}`
                  : 'No attendance records exist for this user.'
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const paginatedAttendances = attendances.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const getDisplayName = (): string => {
    if (showAllUsers) return 'Team Attendance'
    if (attendances.length > 0) {
      const user = attendances[0].user
      const isViewingOwnAttendance = currentUser && user.id === currentUser.id
      
      let displayName = ''
      if (user.firstName && user.lastName) {
        displayName = `${user.firstName} ${user.lastName}'s Attendance`
      } else {
        displayName = `${user.email}'s Attendance`
      }
      
      if (!isViewingOwnAttendance && userId) {
        displayName += ` (Manager View)`
      }
      
      return displayName
    }
    return 'Attendance Records'
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {getDisplayName()}
        </Typography>
        
        {userId && !showAllUsers && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: 1, borderColor: 'info.200' }}>
            <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
              Viewing attendance records for user ID: {userId}
            </Typography>
            {currentUser && userId !== currentUser.id && (
              <Typography variant="caption" color="info.main">
                You are viewing another user's attendance as a manager
              </Typography>
            )}
          </Box>
        )}
        
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell width="40px"></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                {showAllUsers && <TableCell><strong>Employee</strong></TableCell>}
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Check In</strong></TableCell>
                <TableCell><strong>Check Out</strong></TableCell>
                <TableCell><strong>Total Hours</strong></TableCell>
                <TableCell><strong>Overtime/Deficit</strong></TableCell>
                <TableCell align="center">
                  <Tooltip title="Additional Details">
                    <Info fontSize="small" />
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAttendances.map((attendance) => {
                const rowId = `${attendance.userId}-${attendance.date}`
                const isExpanded = expandedRows.has(rowId)
                
                return (
                  <React.Fragment key={rowId}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          size="small"
                          onClick={() => toggleRowExpansion(rowId)}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {attendance.date}
                        </Typography>
                      </TableCell>
                      
                      {showAllUsers && (
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {attendance.user.firstName && attendance.user.lastName
                                ? `${attendance.user.firstName} ${attendance.user.lastName}`
                                : attendance.user.email
                              }
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attendance.user.role || 'Care Worker'} • ID: {attendance.userId}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      
                      <TableCell>{getStatusChip(attendance)}</TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(attendance.checkInTime)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatTime(attendance.checkOutTime)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {attendance.totalHoursWorked}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {getOvertimeChip(attendance.overtime, attendance.negativeWorkingHours)}
                      </TableCell>
                      
                      <TableCell align="center">
                        <Tooltip title={isExpanded ? "Hide Details" : "Show Details"}>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(rowId)}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Details Row */}
                    <TableRow>
                      <TableCell colSpan={showAllUsers ? 9 : 8} sx={{ py: 0, border: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 2, backgroundColor: 'grey.25' }}>
                            <Typography variant="subtitle2" gutterBottom color="primary">
                              Additional Details
                            </Typography>
                            
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  User ID
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace">
                                  {attendance.userId}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Check-in Note
                                </Typography>
                                <Typography variant="body2">
                                  {attendance.checkInNote || 'No note provided'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Check-out Note
                                </Typography>
                                <Typography variant="body2">
                                  {attendance.checkOutNote || 'No note provided'}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Full Check-in Time
                                </Typography>
                                <Typography variant="body2">
                                  {formatDateTime(attendance.checkInTime)}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Full Check-out Time
                                </Typography>
                                <Typography variant="body2">
                                  {formatDateTime(attendance.checkOutTime)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={attendances.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  )
}

export default UserAttendanceTable