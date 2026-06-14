import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  const { publicKey, name, role, additional } = body; // additional is company or skills

  if (!publicKey || !name || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    if (role === 'CLIENT') {
      const client = await prisma.client.create({
        data: {
          id: publicKey,
          name: name,
          company: additional,
        },
      });
      return NextResponse.json({ role: 'CLIENT', profile: client });
    } else if (role === 'FREELANCER') {
      const freelancer = await prisma.freelancer.create({
        data: {
          id: publicKey,
          name: name,
          skills: additional,
        },
      });
      return NextResponse.json({ role: 'FREELANCER', profile: freelancer });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
