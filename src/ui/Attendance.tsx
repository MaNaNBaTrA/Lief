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
import Loader from '@/components/LottieLoader';

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


      if (showAllUsers && dateFilter) {
        query = GET_ALL_ATTENDANCES_BY_DATE
        variables = { date: dateFilter }
      } else {
        if (userId && userId.trim() !== '') {
          targetUserId = userId.trim()
        } else {
          targetUserId = authUser.id
        }

        query = GET_USER_ATTENDANCES
        variables = { userId: targetUserId }
      }

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

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message || 'GraphQL error occurred')
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query')
      }

      const data = showAllUsers && dateFilter 
        ? result.data.getAttendancesByDate 
        : result.data.getAttendancesByUser

      
      let filteredData = data || []
      if (userId && userId.trim() !== '' && !showAllUsers) {
        filteredData = filteredData.filter((attendance: Attendance) => 
          attendance.userId === userId.trim()
        )
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
    
    const timeoutId = setTimeout(() => {
      fetchAttendances()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [userId, showAllUsers, dateFilter])


  const parseDateTime = (dateTime?: string | null): Date | null => {
    if (!dateTime || typeof dateTime !== 'string') return null
    
    try {
      if (/^\d+$/.test(dateTime.toString().trim())) {
        const timestamp = parseInt(dateTime.toString())
        return new Date(timestamp)
      } else {
        let dateToProcess = dateTime.toString().trim()
        let date = new Date(dateToProcess)
        
        if (isNaN(date.getTime()) && dateToProcess.includes(' ') && !dateToProcess.includes('T')) {
          const isoString = dateToProcess.replace(' ', 'T')
          date = new Date(isoString)
          
          if (isNaN(date.getTime())) {
            const isoStringWithZ = dateToProcess.replace(' ', 'T') + 'Z'
            date = new Date(isoStringWithZ)
          }
        }
        
        return isNaN(date.getTime()) ? null : date
      }
    } catch (error) {
      console.log('Date parsing error:', error, 'for value:', dateTime)
      return null
    }
  }

  const formatDateTime = (dateTime?: string | null): string => {
    const date = parseDateTime(dateTime)
    if (!date) return 'N/A'
    
    if (dateTime && /^\d+$/.test(dateTime.toString().trim())) {
      const year = date.getUTCFullYear()
      const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
      const day = date.getUTCDate()
      const hours = date.getUTCHours()
      const minutes = date.getUTCMinutes()
      
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
      
      return `${month} ${day}, ${year}, ${timeString}`
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatTime = (dateTime?: string | null): string => {
    const date = parseDateTime(dateTime)
    if (!date) return 'N/A'
    
    if (dateTime && /^\d+$/.test(dateTime.toString().trim())) {
      const hours = date.getUTCHours()
      const minutes = date.getUTCMinutes()
      
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
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
      <div className='center w-full h-full'>
        <Loader width={400} height={400}/>
      </div>
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
                                  Check-in Time (with Date)
                                </Typography>
                                <Typography variant="body2">
                                  {formatDateTime(attendance.checkInTime)}
                                </Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Check-out Time (with Date)
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

export default UserAttendanceTable;