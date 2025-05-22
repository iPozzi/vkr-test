import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const components = await prisma.component.findMany({
      include: {
        manufacturer: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(components);
  } catch (error) {
    console.error('Error fetching components:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 