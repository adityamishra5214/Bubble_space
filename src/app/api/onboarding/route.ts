import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { z } from 'zod';

const onboardingSchema = z.object({
  companyName: z.string().min(2),
  founder: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    designation: z.string().default('Founder & CEO'),
  }),
  employees: z.array(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      designation: z.string().default('Team Member'),
      departmentName: z.string().optional(),
      reportsToEmail: z.string().optional(), // email of manager
    })
  ).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = onboardingSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.founder.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Founder email already registered' }, { status: 400 });
    }

    const defaultPasswordHash = await hashPassword('password123');
    const founderPasswordHash = await hashPassword(data.founder.password);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: { name: data.companyName.trim() },
      });

      // 2. Create Departments
      const deptMap: Record<string, string> = {};
      const defaultDepts = ['Engineering', 'Product', 'Marketing', 'Operations', 'Design'];
      for (const dName of defaultDepts) {
        const d = await tx.department.create({
          data: { name: dName, companyId: company.id },
        });
        deptMap[dName] = d.id;
      }

      // Default Flow
      const flow = await tx.flow.create({
        data: {
          name: 'Core Operations Flow',
          description: 'Initial company operational workflow.',
          companyId: company.id,
        },
      });

      // 3. Create Founder
      const founder = await tx.user.create({
        data: {
          name: data.founder.name.trim(),
          email: data.founder.email.toLowerCase().trim(),
          password: founderPasswordHash,
          role: 'FOUNDER',
          designation: data.founder.designation || 'Founder & CEO',
          departmentId: deptMap['Product'] || null,
          companyId: company.id,
          status: 'ACTIVE',
        },
      });

      // Map email -> user object
      const userMap: Record<string, string> = {
        [founder.email.toLowerCase()]: founder.id,
      };

      // 4. Create initial employees in 2 passes (first create all, then wire reporting)
      const createdEmployees = [];
      for (const emp of data.employees) {
        let deptId = null;
        if (emp.departmentName) {
          if (deptMap[emp.departmentName]) {
            deptId = deptMap[emp.departmentName];
          } else {
            const newD = await tx.department.create({
              data: { name: emp.departmentName, companyId: company.id },
            });
            deptMap[emp.departmentName] = newD.id;
            deptId = newD.id;
          }
        }

        const newEmp = await tx.user.create({
          data: {
            name: emp.name.trim(),
            email: emp.email.toLowerCase().trim(),
            password: defaultPasswordHash,
            role: 'EMPLOYEE',
            designation: emp.designation || 'Team Member',
            departmentId: deptId,
            companyId: company.id,
            status: 'ACTIVE',
          },
        });

        userMap[emp.email.toLowerCase()] = newEmp.id;
        createdEmployees.push({ empRecord: newEmp, original: emp });
      }

      // Wire managers
      for (const item of createdEmployees) {
        if (item.original.reportsToEmail && userMap[item.original.reportsToEmail.toLowerCase()]) {
          await tx.user.update({
            where: { id: item.empRecord.id },
            data: { managerId: userMap[item.original.reportsToEmail.toLowerCase()] },
          });
        } else {
          // Default reports to founder
          await tx.user.update({
            where: { id: item.empRecord.id },
            data: { managerId: founder.id },
          });
        }
      }

      return { company, founder, flow };
    });

    await logActivity({
      companyId: result.company.id,
      actorId: result.founder.id,
      entityType: 'COMPANY',
      entityId: result.company.id,
      action: 'FLOW_CREATED',
      metadata: { name: `Organization setup complete with ${data.employees.length + 1} members.` },
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
      company: result.company,
      founder: { id: result.founder.id, name: result.founder.name, email: result.founder.email },
    });
  } catch (error: unknown) {
    console.error('Onboarding POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
