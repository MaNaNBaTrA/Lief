import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

const typeDefs = gql`
  type User {
    id: String!
    email: String!
    firstName: String
    lastName: String
    number: String
    address: String
    role: String
    gender: String
    latitude: Float
    longitude: Float
    reportingTime: String
    totalWorkingHours: String
    createdAt: String
    updatedAt: String
    imageUrl: String
    attendances: [Attendance!]!
  }

  type Attendance {
    userId: String!
    checkInTime: String
    checkOutTime: String
    checkInNote: String
    checkOutNote: String
    overtime: String
    negativeWorkingHours: String
    totalHoursWorked: String
    date: String!
    isHoliday: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User!
  }

  input CreateUserInput {
    id: String!
    email: String!
    firstName: String
    lastName: String
    number: String
    address: String
    role: String
    gender: String
    latitude: Float
    longitude: Float
    reportingTime: String
    totalWorkingHours: String
    imageUrl: String
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    number: String
    address: String
    gender: String
    latitude: Float
    longitude: Float
    reportingTime: String
    totalWorkingHours: String
    imageUrl: String
  }

  input CreateAttendanceInput {
    userId: String!
    checkInTime: String
    checkOutTime: String
    checkInNote: String
    checkOutNote: String
    overtime: String
    negativeWorkingHours: String
    totalHoursWorked: String
    date: String
    isHoliday: Boolean
    userLatitude: Float
    userLongitude: Float
  }

  input UpdateAttendanceInput {
    checkInTime: String
    checkOutTime: String
    checkInNote: String
    checkOutNote: String
    overtime: String
    negativeWorkingHours: String
    totalHoursWorked: String
    isHoliday: Boolean
    userLatitude: Float
    userLongitude: Float
  }

  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: String!, data: UpdateUserInput!): User!
    createAttendance(data: CreateAttendanceInput!): Attendance!
    updateAttendance(userId: String!, date: String!, data: UpdateAttendanceInput!): Attendance!
    deleteAttendance(userId: String!, date: String!): Boolean!
    updateUserLocation(id: String!, latitude: Float!, longitude: Float!): User!
  }

  type Query {
    userByEmail(email: String!): User
    getUserById(id: String!): User
    getAllUsers: [User!]!
    getAttendance(userId: String!, date: String!): Attendance
    getAttendancesByUser(userId: String!): [Attendance!]!
    getAttendancesByDate(date: String!): [Attendance!]!
    _empty: String
  }

  type OfficeLocation {
    id: String!
    name: String!
    latitude: Float!
    longitude: Float!
    createdAt: String!
    updatedAt: String!
  }

  input CreateOfficeLocationInput {
    name: String!
    latitude: Float!
    longitude: Float!
  }

  input UpdateOfficeLocationInput {
    name: String
    latitude: Float
    longitude: Float
  }

  extend type Query {
    getOfficeLocation(id: String!): OfficeLocation
    getAllOfficeLocations: [OfficeLocation!]!
    getOfficeLocationByName(name: String!): OfficeLocation
  }

  extend type Mutation {
    createOfficeLocation(data: CreateOfficeLocationInput!): OfficeLocation!
    updateOfficeLocation(id: String!, data: UpdateOfficeLocationInput!): OfficeLocation!
    deleteOfficeLocation(id: String!): Boolean!
  }
`

interface CreateUserInput {
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
}

interface UpdateUserInput {
  firstName?: string
  lastName?: string
  number?: string
  address?: string
  gender?: string
  latitude?: number
  longitude?: number
  reportingTime?: string
  totalWorkingHours?: string
  imageUrl?: string
}

interface CreateAttendanceInput {
  userId: string
  checkInTime?: string
  checkOutTime?: string
  checkInNote?: string
  checkOutNote?: string
  overtime?: string
  negativeWorkingHours?: string
  totalHoursWorked?: string
  date?: string
  isHoliday?: boolean
  userLatitude?: number
  userLongitude?: number
}

interface UpdateAttendanceInput {
  checkInTime?: string
  checkOutTime?: string
  checkInNote?: string
  checkOutNote?: string
  overtime?: string
  negativeWorkingHours?: string
  totalHoursWorked?: string
  isHoliday?: boolean
  userLatitude?: number
  userLongitude?: number
}

interface CreateOfficeLocationInput {
  name: string
  latitude: number
  longitude: number
}

interface UpdateOfficeLocationInput {
  name?: string
  latitude?: number
  longitude?: number
}

// const FALLBACK_LATITUDE = 28.6752768
// const FALLBACK_LONGITUDE = 77.1817472

const DEFAULT_TIMEZONE = 'Asia/Kolkata' 

const formatDate = (date: Date, timezone: string = DEFAULT_TIMEZONE): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric'
  })
  return formatter.format(date)
}

const getTodayDateString = (timezone: string = DEFAULT_TIMEZONE): string => {
  const today = new Date()
  return formatDate(today, timezone)
}

const getDateFromTimestamp = (timestamp: string | Date, timezone: string = DEFAULT_TIMEZONE): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return formatDate(date, timezone)
}

const formatHoursToTimeString = (hours: number): string => {
  if (!hours || isNaN(hours) || hours <= 0) {
    return "0h 0m 0s"
  }

  const totalSeconds = Math.floor(Math.abs(hours) * 3600)
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  return `${hrs}h ${mins}m ${secs}s`
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

const calculateOvertimeAndNegative = (totalHours: number, expectedHours: number) => {
  const validTotalHours = isNaN(totalHours) || totalHours < 0 ? 0 : totalHours
  const validExpectedHours = isNaN(expectedHours) || expectedHours <= 0 ? 8 : expectedHours

  if (validTotalHours > validExpectedHours) {
    return {
      overtime: validTotalHours - validExpectedHours,
      negativeWorkingHours: 0
    }
  } else {
    return {
      overtime: 0,
      negativeWorkingHours: validExpectedHours - validTotalHours
    }
  }
}

const resolvers = {
  User: {
    attendances: async (parent: any) => {
      return prisma.attendance.findMany({
        where: { userId: parent.id },
        orderBy: { date: 'desc' }
      })
    }
  },

  Attendance: {
    user: async (parent: any) => {
      return prisma.user.findUnique({
        where: { id: parent.userId }
      })
    }
  },

  Query: {
    userByEmail: async (_parent: unknown, args: { email: string }) => {
      return prisma.user.findUnique({
        where: { email: args.email },
      })
    },

    getUserById: async (_parent: unknown, args: { id: string }) => {
      return prisma.user.findUnique({
        where: { id: args.id },
      })
    },

    getAllUsers: async () => {
      return prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      })
    },

    getAttendance: async (_parent: unknown, args: { userId: string; date: string }) => {
      return prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: args.userId,
            date: args.date
          }
        }
      })
    },

    getAttendancesByUser: async (_parent: unknown, args: { userId: string }) => {
      return prisma.attendance.findMany({
        where: { userId: args.userId },
        orderBy: { date: 'desc' }
      })
    },

    getAttendancesByDate: async (_parent: unknown, args: { date: string }) => {
      return prisma.attendance.findMany({
        where: { date: args.date },
        include: { user: true }
      })
    },

    getOfficeLocation: async (_parent: unknown, args: { id: string }) => {
      return prisma.officeLocation.findUnique({
        where: { id: args.id }
      })
    },

    getAllOfficeLocations: async () => {
      return prisma.officeLocation.findMany({
        orderBy: { name: 'asc' }
      })
    },

    getOfficeLocationByName: async (_parent: unknown, args: { name: string }) => {
      return prisma.officeLocation.findUnique({
        where: { name: args.name }
      })
    }
  },

  Mutation: {
    createUser: async (_parent: unknown, args: { data: CreateUserInput }) => {
      const {
        id, email, firstName, lastName, number, address, role,
        gender, latitude, longitude, reportingTime, totalWorkingHours, imageUrl
      } = args.data

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        return existingUser
      }

      return prisma.user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          number,
          address,
          role: role || 'Care Worker',
          gender,
          latitude: latitude || null, 
          longitude: longitude || null, 
          reportingTime: reportingTime || '08:00:00',
          totalWorkingHours: totalWorkingHours || '8h 0m 0s',
          imageUrl
        },
      })
    },

    updateUser: async (_parent: unknown, args: { id: string; data: UpdateUserInput }) => {
      const { id, data } = args

      const existingUser = await prisma.user.findUnique({
        where: { id },
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      )

      return prisma.user.update({
        where: { id },
        data: updateData,
      })
    },

    updateUserLocation: async (_parent: unknown, args: { id: string; latitude: number; longitude: number }) => {
      const { id, latitude, longitude } = args

      const existingUser = await prisma.user.findUnique({
        where: { id },
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      console.log('Updating user location:', {
        userId: id,
        latitude,
        longitude
      })

      return prisma.user.update({
        where: { id },
        data: {
          latitude,
          longitude
        },
      })
    },

    createAttendance: async (_parent: unknown, args: { data: CreateAttendanceInput }) => {
      const {
        userId, checkInTime, checkOutTime, checkInNote, checkOutNote,
        overtime, negativeWorkingHours, totalHoursWorked, date, isHoliday,
        userLatitude, userLongitude
      } = args.data

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('User not found')
      }
      
      if (userLatitude && userLongitude && !user.latitude && !user.longitude) {
        console.log('Setting office location from first check-in:', {
          userId,
          latitude: userLatitude,
          longitude: userLongitude
        })

        await prisma.user.update({
          where: { id: userId },
          data: {
            latitude: userLatitude,
            longitude: userLongitude
          }
        })
      }

      let attendanceDate: string
      if (date) {
        attendanceDate = date
      } else if (checkInTime) {
        attendanceDate = getDateFromTimestamp(checkInTime, DEFAULT_TIMEZONE)
      } else {
        attendanceDate = getTodayDateString()
      }

      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date: attendanceDate
          }
        }
      })

      if (existingAttendance) {
        throw new Error('Attendance record already exists for this user and date')
      }

      const checkInTimeForStorage = checkInTime || null
      const checkOutTimeForStorage = checkOutTime || null

      console.log('Creating attendance:', {
        userId,
        date: attendanceDate,
        checkInTime: checkInTime,
        checkInTimeForStorage,
        checkOutTime: checkOutTime,
        checkOutTimeForStorage,
        userLocation: userLatitude && userLongitude ? { lat: userLatitude, lng: userLongitude } : 'Not provided',
        willShowInDB: checkInTime ? new Date(checkInTime).toISOString() : null
      })

      return prisma.attendance.create({
        data: {
          userId,
          checkInTime: checkInTimeForStorage,
          checkOutTime: checkOutTimeForStorage,
          checkInNote: checkInNote || null,
          checkOutNote: checkOutNote || null,
          overtime: overtime || "0h 0m 0s",
          negativeWorkingHours: negativeWorkingHours || "0h 0m 0s",
          totalHoursWorked: totalHoursWorked || "0h 0m 0s",
          date: attendanceDate,
          isHoliday: isHoliday ?? false
        }
      })
    },

    updateAttendance: async (_parent: unknown, args: { userId: string; date: string; data: UpdateAttendanceInput }) => {
      const { userId, date, data } = args

      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date
          }
        }
      })

      if (!existingAttendance) {
        throw new Error('Attendance record not found')
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (data.userLatitude && data.userLongitude && user && !user.latitude && !user.longitude) {
        console.log('Setting office location from attendance update:', {
          userId,
          latitude: data.userLatitude,
          longitude: data.userLongitude
        })

        await prisma.user.update({
          where: { id: userId },
          data: {
            latitude: data.userLatitude,
            longitude: data.userLongitude
          }
        })
      }

      const updateData: any = {}

      if (data.checkInTime !== undefined) {
        updateData.checkInTime = data.checkInTime
      }

      if (data.checkOutTime !== undefined) {
        updateData.checkOutTime = data.checkOutTime
      }

      if (data.checkInNote !== undefined) updateData.checkInNote = data.checkInNote
      if (data.checkOutNote !== undefined) updateData.checkOutNote = data.checkOutNote

      if (data.checkOutTime && (updateData.checkInTime || existingAttendance.checkInTime)) {
        const checkInTime = updateData.checkInTime || existingAttendance.checkInTime
        const checkOutTime = updateData.checkOutTime

        if (checkInTime && checkOutTime) {
          const checkInDate = new Date(checkInTime)
          const checkOutDate = new Date(checkOutTime)
          const diffMs = checkOutDate.getTime() - checkInDate.getTime()
          const totalHours = Math.max(0, diffMs / (1000 * 60 * 60))

          updateData.totalHoursWorked = formatHoursToTimeString(totalHours)

          const expectedHours = user?.totalWorkingHours ? parseTimeStringToHours(user.totalWorkingHours) : 8
          const { overtime, negativeWorkingHours } = calculateOvertimeAndNegative(totalHours, expectedHours)

          updateData.overtime = formatHoursToTimeString(overtime)
          updateData.negativeWorkingHours = formatHoursToTimeString(negativeWorkingHours)

          console.log('Backend checkout calculation:', {
            checkInTime: checkInDate.toISOString(),
            checkOutTime: checkOutDate.toISOString(),
            checkInLocal: checkInDate.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }),
            checkOutLocal: checkOutDate.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }),
            diffMs,
            totalHours,
            expectedHours,
            overtime,
            negativeWorkingHours,
            totalFormatted: updateData.totalHoursWorked,
            overtimeFormatted: updateData.overtime,
            negativeFormatted: updateData.negativeWorkingHours
          })
        }
      }

      if (data.totalHoursWorked !== undefined && !data.checkOutTime) {
        updateData.totalHoursWorked = data.totalHoursWorked || "0h 0m 0s"
      }
      if (data.overtime !== undefined && !data.checkOutTime) {
        updateData.overtime = data.overtime || "0h 0m 0s"
      }
      if (data.negativeWorkingHours !== undefined && !data.checkOutTime) {
        updateData.negativeWorkingHours = data.negativeWorkingHours || "0h 0m 0s"
      }
      if (data.isHoliday !== undefined) {
        updateData.isHoliday = data.isHoliday
      }

      console.log('Updating attendance with:', updateData)

      return prisma.attendance.update({
        where: {
          userId_date: {
            userId,
            date
          }
        },
        data: updateData
      })
    },

    deleteAttendance: async (_parent: unknown, args: { userId: string; date: string }) => {
      const { userId, date } = args

      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date
          }
        }
      })

      if (!existingAttendance) {
        throw new Error('Attendance record not found')
      }

      await prisma.attendance.delete({
        where: {
          userId_date: {
            userId,
            date
          }
        }
      })

      return true
    },

    createOfficeLocation: async (_parent: unknown, args: { data: CreateOfficeLocationInput }) => {
      const { name, latitude, longitude } = args.data

      const existingOffice = await prisma.officeLocation.findUnique({
        where: { name }
      })

      if (existingOffice) {
        throw new Error('Office location with this name already exists')
      }

      return prisma.officeLocation.create({
        data: {
          name,
          latitude,
          longitude
        }
      })
    },

    updateOfficeLocation: async (_parent: unknown, args: { id: string; data: UpdateOfficeLocationInput }) => {
      const { id, data } = args

      const existingOffice = await prisma.officeLocation.findUnique({
        where: { id }
      })

      if (!existingOffice) {
        throw new Error('Office location not found')
      }

      if (data.name && data.name !== existingOffice.name) {
        const nameExists = await prisma.officeLocation.findUnique({
          where: { name: data.name }
        })

        if (nameExists) {
          throw new Error('Office location with this name already exists')
        }
      }

      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      )

      return prisma.officeLocation.update({
        where: { id },
        data: updateData
      })
    },

    deleteOfficeLocation: async (_parent: unknown, args: { id: string }) => {
      const { id } = args

      const existingOffice = await prisma.officeLocation.findUnique({
        where: { id }
      })

      if (!existingOffice) {
        throw new Error('Office location not found')
      }

      await prisma.officeLocation.delete({
        where: { id }
      })

      return true
    }
    
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
})

const handler = startServerAndCreateNextHandler(server)
export { handler as GET, handler as POST }