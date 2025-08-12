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
    createdAt: String
    updatedAt: String
    imageUrl: String
  }

  input CreateUserInput {
    id: String!
    email: String!
    firstName: String
    lastName: String
    number: String
    address: String
    role: String
    imageUrl: String
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    number: String
    address: String
    imageUrl: String
  }

  type Mutation {
    createUser(data: CreateUserInput!): User!
    updateUser(id: String!, data: UpdateUserInput!): User!
  }

  type Query {
    userByEmail(email: String!): User
    getUserById(id: String!): User
    _empty: String
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
  imageUrl?: string
}

interface UpdateUserInput {
  firstName?: string
  lastName?: string
  number?: string
  address?: string
  imageUrl?: string
}

const resolvers = {
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
  },

  Mutation: {
    createUser: async (_parent: unknown, args: { data: CreateUserInput }) => {
      const { id, email, firstName, lastName, number, address, role, imageUrl } = args.data

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
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
})

const handler = startServerAndCreateNextHandler(server)
export { handler as GET, handler as POST }