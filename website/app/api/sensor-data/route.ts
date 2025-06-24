import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { temperature, humidity, pressure, gasResistance } = body;
    
    if (typeof temperature !== 'number' || 
        typeof humidity !== 'number' || 
        typeof pressure !== 'number' || 
        typeof gasResistance !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data: temperature, humidity, pressure, and gasResistance must be numbers' },
        { status: 400 }
      );
    }

    // Store sensor data in database
    const sensorData = await prisma.sensorData.create({
      data: {
        temperature,
        humidity,
        pressure,
        gasResistance,
      },
    });

    console.log('Sensor data stored:', sensorData);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Sensor data stored successfully',
        id: sensorData.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error storing sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to store sensor data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || '24h';
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Calculate cutoff time based on timeFrame
    const now = new Date();
    const cutoffTime = new Date();
    
    switch (timeFrame) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoffTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffTime.setDate(now.getDate() - 30);
        break;
      default:
        cutoffTime.setDate(now.getDate() - 1);
    }

    // Get sensor data within time frame
    const sensorData = await prisma.sensorData.findMany({
      where: {
        timestamp: {
          gte: cutoffTime,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: sensorData,
      count: sensorData.length,
      timeFrame,
      cutoffTime: cutoffTime.toISOString(),
    });

  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}
