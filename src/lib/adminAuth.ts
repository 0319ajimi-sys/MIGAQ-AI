import { cookies } from 'next/headers'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('migaq_admin')?.value
  const secret = process.env.ADMIN_SECRET ?? 'fallback-secret'
  return token === secret
}
