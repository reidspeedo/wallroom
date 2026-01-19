import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  try {
    const settings = await prisma.userSetting.findFirst();

    if (!settings) {
      redirect('/setup');
    }

    redirect('/admin/login');
  } catch (error) {
    redirect('/setup');
  }
}

