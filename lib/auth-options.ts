import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: true,
  // NOTE: PrismaAdapter is NOT compatible with CredentialsProvider
  // When using credentials, NextAuth uses JWT sessions and does not persist to database
  // adapter: PrismaAdapter(prisma); // ← REMOVED - This was causing the login to always fail
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Login attempt for:', credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            console.log('[AUTH] User not found:', credentials.email);
            return null;
          }

          console.log('[AUTH] User found:', user.email, 'Role:', user.role);
          console.log('[AUTH] Password hash from DB:', user.password.substring(0, 20) + '...');
          console.log('[AUTH] Password provided length:', credentials.password.length);

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('[AUTH] Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for user:', credentials.email);
            return null;
          }

          console.log('[AUTH] Login successful for:', user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Error during authorization:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
