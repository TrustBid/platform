'use client';

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { ProjectStatus } from '@/types/public';

type BadgeVariant = BadgeProps['variant'];

const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  Education: 'default',
  Health: 'success',
  Infrastructure: 'secondary',
  Environment: 'success',
  Social: 'warning',
  Operations: 'muted',
};

export function CategoryBadge({ category }: { category: string }) {
  return <Badge variant={CATEGORY_VARIANT[category] ?? 'secondary'}>{category}</Badge>;
}

const STATUS_VARIANT: Record<ProjectStatus, BadgeVariant> = {
  active: 'success',
  completed: 'muted',
  paused: 'warning',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useLanguage();
  return <Badge variant={STATUS_VARIANT[status]}>{t(`status.${status}`)}</Badge>;
}
