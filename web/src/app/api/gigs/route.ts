import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get('publicKey');
  const role = searchParams.get('role');

  if (!publicKey || !role) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const gigs = await prisma.gig.findMany({
      where: role === 'CLIENT' ? { clientId: publicKey } : { freelancerId: publicKey },
      include: {
        client: true,
        freelancer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(gigs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, amount, clientId, freelancerId } = body;

  try {
    const gig = await prisma.gig.create({
      data: {
        title,
        amount: parseInt(amount),
        clientId,
        freelancerId,
        status: 0, // Initialized
      },
    });
    return NextResponse.json(gig);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status } = body;

  try {
    const gig = await prisma.gig.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(gig);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
