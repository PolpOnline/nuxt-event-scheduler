import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import { NuxtAuthHandler } from '#auth'

const prisma = new PrismaClient()

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt ({ token, account, profile }) {
      if (account && profile && profile.email) {
        const user = await prisma.user.upsert({
          where: {
            email: profile.email
          },
          update: {
            name: profile.name
          },
          create: {
            name: profile.name,
            email: profile.email
          }
        })

        token.id = user.id
        token.interactiveDone = user.interactiveDone
        token.section = user.section
      }

      return token
    },

    async session ({ session, token }) {
      // @ts-ignore
      session.user.id = token.id

      const userToSet = {
        section: token.section
      }

      const user = await prisma.user.findUnique({
        where: {
          // @ts-ignore
          id: token.id
        },
        select: {
          interactiveDone: true,
          section: !userToSet.section
        }
      })

      if (!user) {
        throw 'User not found'
      }

      if (!userToSet.section) {
        userToSet.section = user.section
      }

      // @ts-ignore
      session.user.section = userToSet.section

      // @ts-ignore
      session.user.interactiveDone = user.interactiveDone

      return session
    },

    async signIn ({ profile, user, email, account, credentials }) {
      if (!process.env.EMAIL_DOMAIN) {
        throw 'EMAIL_DOMAIN ENVIRONMENT VARIABLE MISSING'
      }
      return Boolean(profile?.email?.endsWith(process.env.EMAIL_DOMAIN))
    }
  },
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: 'https://accounts.google.com/o/oauth2/auth?response_type=code&hd=' + process.env.EMAIL_DOMAIN
    })
  ]
})
