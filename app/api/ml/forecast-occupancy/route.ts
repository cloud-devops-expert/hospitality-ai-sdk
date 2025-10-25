/**
 * Occupancy Forecasting API Route
 *
 * Statistical time series forecasting for hotel occupancy
 * Cost: $0 (pure statistics, no ML)
 */

import { NextResponse } from 'next/server';
import { forecastOccupancy, generateSampleData, type OccupancyData } from '@/lib/ml/timeseries/occupancy-forecasting';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { historicalData, daysToForecast, useSampleData } = body;

    let data: OccupancyData[];

    if (useSampleData) {
      // Generate sample data for demo
      data = generateSampleData(30);
    } else {
      if (!historicalData || !Array.isArray(historicalData) || historicalData.length < 7) {
        return NextResponse.json(
          { error: 'Invalid request. Requires at least 7 days of historical data.' },
          { status: 400 }
        );
      }
      data = historicalData;
    }

    // Run forecast
    const result = forecastOccupancy(data, daysToForecast || 7);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[ML API] Occupancy forecasting error:', error);
    return NextResponse.json(
      { error: error.message || 'Forecasting failed' },
      { status: 500 }
    );
  }
}
