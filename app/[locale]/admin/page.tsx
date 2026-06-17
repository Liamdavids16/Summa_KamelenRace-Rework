import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('adminTitle'),
  };
}

export default function AdminPage() {
  return <AdminDashboard />;
}
