import { NextResponse } from 'next/server';
import { ROICalculator, type HotelProfile } from '@/lib/business-value/roi-calculator';

export async function POST(request: Request) {
  try {
    const profile: HotelProfile = await request.json();

    const calculator = new ROICalculator();
    const result = calculator.calculateROI(profile);

    return NextResponse.json({
      success: true,
      profile,
      result,
    });
  } catch (error) {
    console.error('ROI calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST a HotelProfile to calculate ROI',
    examplePayload: {
      name: 'My Hotel',
      roomCount: 40,
      averageOccupancy: 75,
      staffCount: 15,
      averageStaffHourlyRate: 18,
      manualDataEntry: {
        pmsToPosDaily: 1.5,
        posToAccountingDaily: 2.0,
        wifiGuestTrackingManual: 1.0,
        barInventoryReconciliation: 2.5,
        roomChargeCorrections: 1.5,
      },
      currentErrorRates: {
        billingErrorsPerMonth: 25,
        averageErrorCost: 35,
      },
      existingSystems: {
        hasPMS: true,
        pmsName: 'Cloudbeds',
        hasPOS: true,
        posName: 'Toast',
        hasUniFiWiFi: true,
        hasBarEquipment: true,
        barEquipmentName: 'iPourIt',
      },
    },
  });
}
