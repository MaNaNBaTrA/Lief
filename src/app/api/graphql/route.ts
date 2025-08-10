import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { PrismaClient } from '@/generated/prisma' 

const prisma = new PrismaClient()

const typeDefs = gql`
  type User {
    id: String!
    email: String!
    firstName: String
    lastName: String
    role: String
    position: String
    createdAt: String
    updatedAt: String
  }

  input CreateUserInput {
    id: String!
    email: String!
  }

  type Mutation {
    createUser(data: CreateUserInput!): User!
  }

  type Query {
    userByEmail(email: String!): User
    _empty: String
  }
`

const resolvers = {
  Query: {
    userByEmail: async (_parent: any, args: { email: string }) => {
      return await prisma.user.findUnique({
        where: { email: args.email },
      })
    },
  },

  Mutation: {
    createUser: async (_parent: any, args: { data: { id: string; email: string } }) => {
      const { id, email } = args.data

      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return existingUser
      }

      const newUser = await prisma.user.create({
        data: {
          id,
          email,
        },
      })

      return newUser
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
