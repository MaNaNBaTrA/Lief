'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  Avatar,
  IconButton,
  Tooltip,
  TablePagination,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  Fab,
  useTheme,
  useMediaQuery,
  Collapse,
  Stack,
  Divider
} from '@mui/material'
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  Visibility,
  Search,
  Add,
  ManageAccounts,
  AccessTime,
  Group,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import { Home } from 'lucide-react'

import Loader from '@/components/LottieLoader';

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
  totalWorkingHours?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

const ManagerUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const router = useRouter()
  const supabase = createClientComponentClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const accentColor = '#47f2ca80'
  const accentColorSolid = '#47f2ca'

  const GET_ALL_USERS = `
    query GetAllUsers {
      getAllUsers {
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
  `

  const GET_USER_BY_ID = `
    query GetUserById($id: String!) {
      getUserById(id: $id) {
        id
        email
        firstName
        lastName
        role
      }
    }
  `

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        throw new Error('Authentication required')
      }

      const currentUserResponse = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_USER_BY_ID,
          variables: { id: authUser.id },
        }),
      })

      const currentUserResult = await currentUserResponse.json()

      if (currentUserResult.errors) {
        throw new Error(currentUserResult.errors[0].message)
      }

      const currentUserData = currentUserResult.data.getUserById

      if (!currentUserData) {
        throw new Error('User not found')
      }

      if (currentUserData.role?.toLowerCase() !== 'manager') {
        throw new Error('Access denied: Only managers can view all users')
      }

      setCurrentUser(currentUserData)

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_ALL_USERS,
        }),
      })

      const result = await response.json()

      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      const usersData = result.data.getAllUsers || []
      setUsers(usersData)
      setFilteredUsers(usersData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const email = user.email.toLowerCase()
        const role = (user.role || '').toLowerCase()
        const phone = (user.number || '').toLowerCase()
        const query = searchQuery.toLowerCase()

        return fullName.includes(query) ||
          email.includes(query) ||
          role.includes(query) ||
          phone.includes(query)
      })
      setFilteredUsers(filtered)
    }
    setPage(0)
  }, [searchQuery, users])

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedRows(newExpanded)
  }

  const getRoleChip = (role?: string) => {
    const userRole = role?.toLowerCase() || 'care worker'

    const roleColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' } = {
      'manager': 'primary',
      'care worker': 'secondary',
      'admin': 'success'
    }

    return (
      <Chip
        label={role || 'Care Worker'}
        color={roleColors[userRole] || 'secondary'}
        size="small"
        icon={userRole === 'manager' ? <ManageAccounts /> : <Work />}
      />
    )
  }

  const renderMobileCard = (user: User) => (
    <Card
      key={user.id}
      sx={{
        mb: 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease',
        }
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={user.imageUrl || undefined}
            sx={{
              width: 60,
              height: 60,
              mr: 2,
              border: `2px solid ${accentColor}`,
            }}
          >
            {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {user.id.substring(0, 8)}...
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="medium"
              onClick={() => toggleRowExpansion(user.id)}
              sx={{ backgroundColor: accentColor, '&:hover': { backgroundColor: accentColorSolid } }}
            >
              {expandedRows.has(user.id) ? <ExpandLess sx={{ fontSize: 28 }} /> : <ExpandMore sx={{ fontSize: 28 }} />}
            </IconButton>
            <IconButton
              size="medium"
              color="primary"
              onClick={() => handleUserClick(user.id)}
            >
              <Visibility sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Email sx={{ fontSize: 20, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                [theme.breakpoints.down('sm')]: {
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }
              }}
            >
              {user.email}
            </Typography>
          </Box>
          <Box sx={{ ml: 1, flexShrink: 0 }}>
            {getRoleChip(user.role)}
          </Box>
        </Box>

        <Collapse in={expandedRows.has(user.id)}>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            {user.number && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Phone sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{user.number}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTime sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2">
                  Reporting: {user.reportingTime || 'Not set'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Daily hours: {user.totalWorkingHours || '8h 0m 0s'}
                </Typography>
              </Box>
            </Box>
            {user.address && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{user.address}</Typography>
              </Box>
            )}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )

  const renderEmptyState = () => (
    <Box textAlign="center" py={6}>
      <Group sx={{ fontSize: 72, color: 'text.secondary', mb: 3 }} />
      <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
        No users found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {searchQuery
          ? 'Try adjusting your search criteria.'
          : 'No users exist in the system yet.'
        }
      </Typography>
    </Box>
  )

  if (loading) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader width={400} height={400} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{
            mt: 2,
            backgroundColor: accentColorSolid,
            '&:hover': { backgroundColor: '#36d4a7' },
            borderRadius: 2,
            px: 3
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    )
  }

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <Box sx={{
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: '1400px',
      mx: 'auto',
      minHeight: '100vh'
    }}>
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Group sx={{
              fontSize: { xs: 36, md: 40 },
              color: accentColorSolid,
              mr: { sm: 2 },
              mb: { xs: 1, sm: 0 }
            }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '1.8rem', md: '2.125rem' }
              }}
            >
              User Management
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<Home size={20} />}
            onClick={() => router.push('/')}
            sx={{
              borderColor: accentColorSolid,
              color: accentColorSolid,
              '&:hover': {
                borderColor: '#36d4a7',
                backgroundColor: `${accentColor}`,
                color: '#36d4a7'
              },
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: { xs: '140px', sm: 'auto' }
            }}
          >
            Back to Home
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', md: '1rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
          Manage all users in your organization. Click on any user to view their profile.
        </Typography>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)'
        },
        gap: { xs: 2, md: 3 },
        mb: { xs: 3, md: 4 }
      }}>
        <Card sx={{
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            transition: 'all 0.3s ease'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Group sx={{ 
                color: accentColorSolid, 
                mr: 2, 
                fontSize: { xs: 36, md: 40 },
                p: 1.5,
                backgroundColor: `${accentColor}`,
                borderRadius: 2
              }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{users.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Users</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            transition: 'all 0.3s ease'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ManageAccounts sx={{ 
                color: '#4CAF50', 
                mr: 2, 
                fontSize: { xs: 36, md: 40 },
                p: 1.5,
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: 2
              }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {users.filter(u => u.role?.toLowerCase() === 'manager').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Managers</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          border: `1px solid ${theme.palette.divider}`,
          gridColumn: { xs: '1', sm: 'span 2', md: '3' },
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            transition: 'all 0.3s ease'
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Work sx={{ 
                color: '#2196F3', 
                mr: 2, 
                fontSize: { xs: 36, md: 40 },
                p: 1.5,
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderRadius: 2
              }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {users.filter(u => u.role?.toLowerCase() === 'care worker' || !u.role).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Care Workers</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search users by name, email, role, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: accentColorSolid, fontSize: 24 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: accentColorSolid,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: accentColorSolid,
                  }
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              All Users ({filteredUsers.length})
            </Typography>
          </Box>

          {isMobile ? (
            <Box>
              {paginatedUsers.length === 0 ? (
                renderEmptyState()
              ) : (
                paginatedUsers.map(renderMobileCard)
              )}
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              elevation={0} 
              sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 2,
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: 4,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: accentColorSolid,
                  borderRadius: 4,
                  '&:hover': {
                    backgroundColor: '#36d4a7',
                  },
                },
              }}
            >
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ minWidth: 250 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>User</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 250 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Contact</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Role</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Work Schedule</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 120 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Actions</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        {renderEmptyState()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: `rgba(0, 0, 0, 0.04)`,
                          }
                        }}
                        onClick={() => handleUserClick(user.id)}
                      >
                        <TableCell sx={{ minWidth: 250 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              src={user.imageUrl || undefined}
                              sx={{
                                mr: 2,
                                width: 50,
                                height: 50,
                                border: `2px solid ${accentColor}`
                              }}
                            >
                              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium" noWrap>
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email
                                }
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {user.id.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ minWidth: 250 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <Email sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {user.email}
                              </Typography>
                            </Box>
                            {user.number && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" noWrap>
                                  {user.number}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ minWidth: 150 }}>
                          {getRoleChip(user.role)}
                        </TableCell>

                        <TableCell sx={{ minWidth: 200 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <AccessTime sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" noWrap>
                                {user.reportingTime || 'Not set'}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {user.totalWorkingHours || '8h 0m 0s'} per day
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center" sx={{ minWidth: 120 }}>
                          <Tooltip title="View Profile">
                            <IconButton
                              size="large"
                              sx={{
                                backgroundColor: accentColor,
                                '&:hover': { backgroundColor: accentColorSolid },
                                color: 'white'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUserClick(user.id)
                              }}
                            >
                              <Visibility sx={{ fontSize: 24 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1, borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default ManagerUsersPage