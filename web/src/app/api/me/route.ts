import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get('publicKey');

  if (!publicKey) {
    return NextResponse.json({ error: 'Public key required' }, { status: 400 });
  }

  // Check Client table
  const client = await prisma.client.findUnique({
    where: { id: publicKey },
  });

  if (client) {
    return NextResponse.json({ role: 'CLIENT', profile: client });
  }

  // Check Freelancer table
  const freelancer = await prisma.freelancer.findUnique({
    where: { id: publicKey },
  });

  if (freelancer) {
    return NextResponse.json({ role: 'FREELANCER', profile: freelancer });
  }

  return NextResponse.json({ role: null }, { status: 404 });
}
