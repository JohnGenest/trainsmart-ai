import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Simple demo credentials for MVP
        if (credentials?.email === 'demo@trainsmart.ai' && 
            credentials?.password === 'demo') {
          return {
            id: '1',
            email: 'demo@trainsmart.ai',
            name: 'Demo Runner'
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' }
})

export { handler as GET, handler as POST }