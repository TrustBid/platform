export type ExpenseStatus =
  | 'draft'
  | 'pending_ocr'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'anchored'

export interface Expense {
  id: string
  projectId: string
  organizationId: string
  amountXlm: string
  currency: string
  description: string
  status: ExpenseStatus
  stellarTxHash: string | null
  createdAt: string
}
