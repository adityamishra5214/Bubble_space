import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { z } from 'zod';

const signupSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  name: z.string().min(2, 'Founder name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  designation: z.string().optional().default('Founder'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = signupSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(data.password);

    // Create company and founder user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName.trim(),
        },
      });

      // Default departments
      const engDept = await tx.department.create({
        data: { name: 'Engineering', companyId: company.id },
      });
      await tx.department.create({
        data: { name: 'Product', companyId: company.id },
      });
      await tx.department.create({
        data: { name: 'Marketing', companyId: company.id },
      });
      await tx.department.create({
        data: { name: 'Operations', companyId: company.id },
      });

      // Default initial flow
      await tx.flow.create({
        data: {
          name: 'General Company Flow',
          description: 'Core operational pipeline and initial initiatives.',
          companyId: company.id,
        },
      });

      const founder = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'FOUNDER',
          designation: data.designation || 'Founder',
          departmentId: engDept.id,
          companyId: company.id,
          status: 'ACTIVE',
        },
      });

      return { company, founder };
    });

    await logActivity({
      companyId: result.company.id,
      actorId: result.founder.id,
      entityType: 'COMPANY',
      entityId: result.company.id,
      action: 'FLOW_CREATED',
      metadata: { name: `Created organization ${result.company.name}` },
    });

    const token = await createSessionToken({
      userId: result.founder.id,
      email: result.founder.email,
      role: result.founder.role,
      companyId: result.company.id,
      companyName: result.company.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: result.founder.id,
        name: result.founder.name,
        email: result.founder.email,
        role: result.founder.role,
        companyId: result.company.id,
        companyName: result.company.name,
      },
    });
  } catch (error: unknown) {
    console.error('Signup error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
  }
}
