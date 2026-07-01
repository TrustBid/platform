export interface MetricData {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  icon?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  status: string;
  budgetAmount: number;
  spentAmount: number;
  budgetAsset: string;
}

export interface ActivityEvent {
  id: string;
  type: 'verification' | 'disbursement' | 'expense';
  description: string;
  timestamp: string;
  txHash?: string;
}