import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin | Kamelenrace',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
