import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminDashboard from './dashboard';

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <AdminDashboard />;
}
