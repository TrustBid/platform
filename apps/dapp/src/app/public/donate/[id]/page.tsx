import { notFound } from 'next/navigation';
import { DonateFlow } from '@/components/public/DonateFlow';
import { getProject } from '@/server/public/repository';

export default async function DonatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <DonateFlow
        project={{
          id: project.id,
          name: project.name,
          currency: project.currency,
          category: project.category,
          recipientAddress: project.recipientAddress ?? null,
        }}
      />
    </div>
  );
}
