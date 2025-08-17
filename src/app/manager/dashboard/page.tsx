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
  Fab
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
  Group
} from '@mui/icons-material'

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

  const router = useRouter()
  const supabase = createClientComponentClient()

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

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric'
  //   })
  // }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader width={400} height={400} />
      </div>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
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
    <Box sx={{ p: 4, maxWidth: '1400px', mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Group sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            User Management
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage all users in your organization. Click on any user to view their profile.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Group sx={{ color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">{users.length}</Typography>
                <Typography variant="body2" color="text.secondary">Total Users</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ManageAccounts sx={{ color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {users.filter(u => u.role?.toLowerCase() === 'manager').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Managers</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Work sx={{ color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h6">
                  {users.filter(u => u.role?.toLowerCase() === 'care worker' || !u.role).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Care Workers</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>


      <Card sx={{ mb: 3 }}>
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
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>


      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              All Users ({filteredUsers.length})
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Contact</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Work Schedule</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleUserClick(user.id)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={user.imageUrl || undefined}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
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

                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        {user.number && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.number}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      {getRoleChip(user.role)}
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {user.reportingTime || 'Not set'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {user.totalWorkingHours || '8h 0m 0s'} per day
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="View Profile">
                        <IconButton
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUserClick(user.id)
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1 }}
          />
        </CardContent>
      </Card>


      {filteredUsers.length === 0 && !loading && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Group sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'No users exist in the system yet.'
                }
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default ManagerUsersPage