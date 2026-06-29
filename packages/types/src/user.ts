export type UserRole = 'admin' | 'responsable' | 'contador' | 'donante'

export interface User {
  id: string
  organizationId: string
  email: string
  role: UserRole
  stellarPublicKey: string | null
}
