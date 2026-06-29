export type ProjectStatus = 'active' | 'closed' | 'suspended'

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string
  budgetXlm: string
  spentXlm: string
  status: ProjectStatus
  stellarAccountId: string | null
  createdAt: string
}
