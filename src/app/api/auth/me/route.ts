import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      designation: user.designation,
      status: user.status,
      department: user.department,
      manager: user.manager,
      company: {
        id: user.company.id,
        name: user.company.name,
        logo: user.company.logo,
      },
    },
  });
}
