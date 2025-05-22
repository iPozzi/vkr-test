import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const getUserIdFromRequest = (req: NextRequest) => {
  const token = req.cookies.get('accessToken')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.id;
  } catch {
    return null;
  }
};

// Get user's hardware profile
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get the user's hardware profile with component details
    const hardwareProfile = await prisma.hardwareProfile.findFirst({
      where: { userId },
      include: {
        cpu: { include: { manufacturer: true } },
        gpu: { include: { manufacturer: true } },
      },
    });
    if (!hardwareProfile) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(hardwareProfile);
  } catch (error) {
    console.error('Error fetching hardware profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new hardware profile
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { cpuId, gpuId, ram, vram } = await req.json();
    // Validate input
    if (!cpuId || !gpuId || !ram || !vram) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Check if the user already has a profile
    const existingProfile = await prisma.hardwareProfile.findFirst({
      where: { userId },
    });
    if (existingProfile) {
      return NextResponse.json(
        { message: 'Hardware profile already exists. Use PUT to update.' },
        { status: 409 }
      );
    }
    // Create the hardware profile
    const hardwareProfile = await prisma.hardwareProfile.create({
      data: {
        userId,
        cpuId,
        gpuId,
        ram,
        vram,
      },
      include: {
        cpu: { include: { manufacturer: true } },
        gpu: { include: { manufacturer: true } },
      },
    });
    return NextResponse.json(hardwareProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating hardware profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update an existing hardware profile
export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { cpuId, gpuId, ram, vram } = await req.json();
    // Validate input
    if (!cpuId || !gpuId || !ram || !vram) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Find the user's hardware profile
    const existingProfile = await prisma.hardwareProfile.findFirst({
      where: { userId },
    });
    if (!existingProfile) {
      return NextResponse.json(
        { message: 'Hardware profile not found. Use POST to create a new one.' },
        { status: 404 }
      );
    }
    // Update the hardware profile
    const updatedProfile = await prisma.hardwareProfile.update({
      where: { id: existingProfile.id },
      data: {
        cpuId,
        gpuId,
        ram,
        vram,
      },
      include: {
        cpu: { include: { manufacturer: true } },
        gpu: { include: { manufacturer: true } },
      },
    });
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating hardware profile:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 