/**
 * ROI Calculator - Business Value of Middleware Integration
 *
 * Calculates time savings, cost savings, and ROI for ISV/SI middleware platform
 */

export interface HotelProfile {
  name: string;
  roomCount: number;
  averageOccupancy: number; // percentage (0-100)
  staffCount: number;
  averageStaffHourlyRate: number;

  // Current manual processes (hours per day)
  manualDataEntry: {
    pmsToPosDaily: number; // Hours spent transferring PMS data to POS
    posToAccountingDaily: number; // Hours spent reconciling POS with accounting
    wifiGuestTrackingManual: number; // Hours spent tracking guest requests/locations manually
    barInventoryReconciliation: number; // Hours spent reconciling bar inventory
    roomChargeCorrections: number; // Hours spent fixing billing errors
  };

  // Error rates (current)
  currentErrorRates: {
    billingErrorsPerMonth: number;
    averageErrorCost: number; // Average cost to fix each billing error
  };

  // Existing systems (for integration)
  existingSystems: {
    hasPMS: boolean;
    pmsName?: string;
    hasPOS: boolean;
    posName?: string;
    hasUniFiWiFi: boolean;
    hasBarEquipment: boolean;
    barEquipmentName?: string;
  };
}

export interface ROICalculation {
  // Time savings
  timeSavings: {
    hoursPerDay: number;
    hoursPerMonth: number;
    hoursPerYear: number;
    breakdownByProcess: {
      process: string;
      hoursSavedDaily: number;
      hoursSavedMonthly: number;
      hoursSavedYearly: number;
    }[];
  };

  // Cost savings
  costSavings: {
    laborSavingsMonthly: number;
    laborSavingsYearly: number;
    errorReductionSavingsMonthly: number;
    errorReductionSavingsYearly: number;
    totalSavingsMonthly: number;
    totalSavingsYearly: number;
  };

  // Platform cost
  platformCost: {
    monthlyLicense: number;
    yearlyLicense: number;
    integrationSetupCost: number;
    totalFirstYearCost: number;
  };

  // ROI metrics
  roi: {
    netSavingsMonthly: number;
    netSavingsYearly: number;
    roiPercentage: number;
    paybackPeriodMonths: number;
    breakEvenDate: Date;
  };

  // Business impact
  businessImpact: {
    staffHoursFreedUpDaily: number;
    staffHoursFreedUpMonthly: number;
    equivalentFullTimeEmployees: number; // Hours freed / 160 hours per month
    errorReductionPercentage: number;
    estimatedGuestSatisfactionImprovement: number; // percentage
  };
}

export class ROICalculator {
  /**
   * Calculate ROI for middleware integration
   */
  calculateROI(profile: HotelProfile): ROICalculation {
    // 1. Calculate time savings
    const timeSavings = this.calculateTimeSavings(profile);

    // 2. Calculate cost savings
    const costSavings = this.calculateCostSavings(profile, timeSavings);

    // 3. Calculate platform cost
    const platformCost = this.calculatePlatformCost(profile);

    // 4. Calculate ROI metrics
    const roi = this.calculateROIMetrics(costSavings, platformCost);

    // 5. Calculate business impact
    const businessImpact = this.calculateBusinessImpact(profile, timeSavings);

    return {
      timeSavings,
      costSavings,
      platformCost,
      roi,
      businessImpact,
    };
  }

  private calculateTimeSavings(profile: HotelProfile): ROICalculation['timeSavings'] {
    const manual = profile.manualDataEntry;

    // Middleware automation reduces manual work by:
    // - PMS to POS: 80% (automatic sync)
    // - POS to Accounting: 70% (automatic reconciliation)
    // - WiFi tracking: 90% (automatic location detection)
    // - Bar inventory: 85% (real-time tracking if equipment has API)
    // - Room charge corrections: 75% (fewer errors with automatic billing)

    const savings = [
      {
        process: 'PMS to POS Data Transfer',
        hoursSavedDaily: manual.pmsToPosDaily * 0.80,
        hoursSavedMonthly: manual.pmsToPosDaily * 0.80 * 30,
        hoursSavedYearly: manual.pmsToPosDaily * 0.80 * 365,
      },
      {
        process: 'POS to Accounting Reconciliation',
        hoursSavedDaily: manual.posToAccountingDaily * 0.70,
        hoursSavedMonthly: manual.posToAccountingDaily * 0.70 * 30,
        hoursSavedYearly: manual.posToAccountingDaily * 0.70 * 365,
      },
      {
        process: 'Guest Location Tracking',
        hoursSavedDaily: manual.wifiGuestTrackingManual * 0.90,
        hoursSavedMonthly: manual.wifiGuestTrackingManual * 0.90 * 30,
        hoursSavedYearly: manual.wifiGuestTrackingManual * 0.90 * 365,
      },
      {
        process: 'Bar Inventory Reconciliation',
        hoursSavedDaily: profile.existingSystems.hasBarEquipment
          ? manual.barInventoryReconciliation * 0.85
          : manual.barInventoryReconciliation * 0.30, // Less savings without bar equipment
        hoursSavedMonthly: profile.existingSystems.hasBarEquipment
          ? manual.barInventoryReconciliation * 0.85 * 30
          : manual.barInventoryReconciliation * 0.30 * 30,
        hoursSavedYearly: profile.existingSystems.hasBarEquipment
          ? manual.barInventoryReconciliation * 0.85 * 365
          : manual.barInventoryReconciliation * 0.30 * 365,
      },
      {
        process: 'Room Charge Error Corrections',
        hoursSavedDaily: manual.roomChargeCorrections * 0.75,
        hoursSavedMonthly: manual.roomChargeCorrections * 0.75 * 30,
        hoursSavedYearly: manual.roomChargeCorrections * 0.75 * 365,
      },
    ];

    const totalDaily = savings.reduce((sum, s) => sum + s.hoursSavedDaily, 0);
    const totalMonthly = savings.reduce((sum, s) => sum + s.hoursSavedMonthly, 0);
    const totalYearly = savings.reduce((sum, s) => sum + s.hoursSavedYearly, 0);

    return {
      hoursPerDay: totalDaily,
      hoursPerMonth: totalMonthly,
      hoursPerYear: totalYearly,
      breakdownByProcess: savings,
    };
  }

  private calculateCostSavings(
    profile: HotelProfile,
    timeSavings: ROICalculation['timeSavings']
  ): ROICalculation['costSavings'] {
    // Labor savings
    const hourlyRate = profile.averageStaffHourlyRate;
    const laborSavingsMonthly = timeSavings.hoursPerMonth * hourlyRate;
    const laborSavingsYearly = timeSavings.hoursPerYear * hourlyRate;

    // Error reduction savings
    // Middleware reduces billing errors by 75% (automatic sync = fewer mistakes)
    const currentErrorCostMonthly =
      profile.currentErrorRates.billingErrorsPerMonth *
      profile.currentErrorRates.averageErrorCost;

    const errorReductionSavingsMonthly = currentErrorCostMonthly * 0.75;
    const errorReductionSavingsYearly = errorReductionSavingsMonthly * 12;

    return {
      laborSavingsMonthly,
      laborSavingsYearly,
      errorReductionSavingsMonthly,
      errorReductionSavingsYearly,
      totalSavingsMonthly: laborSavingsMonthly + errorReductionSavingsMonthly,
      totalSavingsYearly: laborSavingsYearly + errorReductionSavingsYearly,
    };
  }

  private calculatePlatformCost(profile: HotelProfile): ROICalculation['platformCost'] {
    // Platform pricing (ISV/SI model)
    // Base: $50/month (small hotels <30 rooms)
    // Mid: $100/month (medium hotels 30-100 rooms)
    // Large: $150/month (large hotels >100 rooms)

    let monthlyLicense = 50;
    if (profile.roomCount > 100) {
      monthlyLicense = 150;
    } else if (profile.roomCount > 30) {
      monthlyLicense = 100;
    }

    // Integration setup costs (one-time)
    // Basic integrations (PMS, POS, WiFi): $1,500
    // + Bar equipment (if they have it): $1,000
    let integrationSetupCost = 1500;
    if (profile.existingSystems.hasBarEquipment) {
      integrationSetupCost += 1000;
    }

    return {
      monthlyLicense,
      yearlyLicense: monthlyLicense * 12,
      integrationSetupCost,
      totalFirstYearCost: monthlyLicense * 12 + integrationSetupCost,
    };
  }

  private calculateROIMetrics(
    costSavings: ROICalculation['costSavings'],
    platformCost: ROICalculation['platformCost']
  ): ROICalculation['roi'] {
    const netSavingsMonthly = costSavings.totalSavingsMonthly - platformCost.monthlyLicense;
    const netSavingsYearly = costSavings.totalSavingsYearly - platformCost.yearlyLicense;

    // ROI percentage: (Net Savings / Total Cost) * 100
    const roiPercentage = (netSavingsYearly / platformCost.totalFirstYearCost) * 100;

    // Payback period: Setup Cost / Monthly Net Savings
    const paybackPeriodMonths = platformCost.integrationSetupCost / netSavingsMonthly;

    // Break-even date
    const breakEvenDate = new Date();
    breakEvenDate.setMonth(breakEvenDate.getMonth() + Math.ceil(paybackPeriodMonths));

    return {
      netSavingsMonthly,
      netSavingsYearly,
      roiPercentage,
      paybackPeriodMonths,
      breakEvenDate,
    };
  }

  private calculateBusinessImpact(
    profile: HotelProfile,
    timeSavings: ROICalculation['timeSavings']
  ): ROICalculation['businessImpact'] {
    // Full-time equivalent: 160 hours per month
    const equivalentFullTimeEmployees = timeSavings.hoursPerMonth / 160;

    // Error reduction (middleware reduces billing errors by 75%)
    const errorReductionPercentage = 75;

    // Guest satisfaction improvement (estimated based on faster service, fewer errors)
    // WiFi-based location awareness + automatic billing = better experience
    const estimatedGuestSatisfactionImprovement = 15; // 15% improvement

    return {
      staffHoursFreedUpDaily: timeSavings.hoursPerDay,
      staffHoursFreedUpMonthly: timeSavings.hoursPerMonth,
      equivalentFullTimeEmployees,
      errorReductionPercentage,
      estimatedGuestSatisfactionImprovement,
    };
  }

  /**
   * Generate a human-readable ROI summary
   */
  generateSummary(profile: HotelProfile, calculation: ROICalculation): string {
    const lines = [
      `ROI ANALYSIS: ${profile.name}`,
      `═══════════════════════════════════════════════════════════`,
      ``,
      `HOTEL PROFILE:`,
      `  Rooms: ${profile.roomCount}`,
      `  Occupancy: ${profile.averageOccupancy}%`,
      `  Staff: ${profile.staffCount}`,
      `  Avg. Hourly Rate: $${profile.averageStaffHourlyRate}/hour`,
      ``,
      `EXISTING SYSTEMS:`,
      `  ✓ PMS: ${profile.existingSystems.hasPMS ? profile.existingSystems.pmsName || 'Yes' : 'None'}`,
      `  ✓ POS: ${profile.existingSystems.hasPOS ? profile.existingSystems.posName || 'Yes' : 'None'}`,
      `  ✓ WiFi: ${profile.existingSystems.hasUniFiWiFi ? 'UniFi' : 'None'}`,
      `  ✓ Bar Equipment: ${profile.existingSystems.hasBarEquipment ? profile.existingSystems.barEquipmentName || 'Yes' : 'None'}`,
      ``,
      `TIME SAVINGS:`,
      `  Daily: ${calculation.timeSavings.hoursPerDay.toFixed(1)} hours`,
      `  Monthly: ${calculation.timeSavings.hoursPerMonth.toFixed(1)} hours`,
      `  Yearly: ${calculation.timeSavings.hoursPerYear.toFixed(0)} hours`,
      ``,
      `BREAKDOWN BY PROCESS:`,
    ];

    calculation.timeSavings.breakdownByProcess.forEach(process => {
      lines.push(`  • ${process.process}:`);
      lines.push(`    ${process.hoursSavedDaily.toFixed(1)} hrs/day, ${process.hoursSavedMonthly.toFixed(0)} hrs/month`);
    });

    lines.push(
      ``,
      `COST SAVINGS:`,
      `  Labor Savings (Monthly): $${calculation.costSavings.laborSavingsMonthly.toFixed(2)}`,
      `  Labor Savings (Yearly): $${calculation.costSavings.laborSavingsYearly.toFixed(2)}`,
      `  Error Reduction (Monthly): $${calculation.costSavings.errorReductionSavingsMonthly.toFixed(2)}`,
      `  Error Reduction (Yearly): $${calculation.costSavings.errorReductionSavingsYearly.toFixed(2)}`,
      `  ───────────────────────────────────────────`,
      `  TOTAL SAVINGS (Monthly): $${calculation.costSavings.totalSavingsMonthly.toFixed(2)}`,
      `  TOTAL SAVINGS (Yearly): $${calculation.costSavings.totalSavingsYearly.toFixed(2)}`,
      ``,
      `PLATFORM COST:`,
      `  Monthly License: $${calculation.platformCost.monthlyLicense}/month`,
      `  Yearly License: $${calculation.platformCost.yearlyLicense}/year`,
      `  Integration Setup (One-Time): $${calculation.platformCost.integrationSetupCost}`,
      `  Total First Year Cost: $${calculation.platformCost.totalFirstYearCost}`,
      ``,
      `ROI METRICS:`,
      `  Net Savings (Monthly): $${calculation.roi.netSavingsMonthly.toFixed(2)}`,
      `  Net Savings (Yearly): $${calculation.roi.netSavingsYearly.toFixed(2)}`,
      `  ROI (First Year): ${calculation.roi.roiPercentage.toFixed(1)}%`,
      `  Payback Period: ${calculation.roi.paybackPeriodMonths.toFixed(1)} months`,
      `  Break-Even Date: ${calculation.roi.breakEvenDate.toLocaleDateString()}`,
      ``,
      `BUSINESS IMPACT:`,
      `  Staff Hours Freed: ${calculation.businessImpact.staffHoursFreedUpMonthly.toFixed(0)} hrs/month`,
      `  Equivalent FTEs: ${calculation.businessImpact.equivalentFullTimeEmployees.toFixed(2)} employees`,
      `  Error Reduction: ${calculation.businessImpact.errorReductionPercentage}%`,
      `  Guest Satisfaction: +${calculation.businessImpact.estimatedGuestSatisfactionImprovement}%`,
      ``,
      `═══════════════════════════════════════════════════════════`,
      `BOTTOM LINE:`,
      `  • You save $${calculation.roi.netSavingsMonthly.toFixed(0)}/month after platform costs`,
      `  • You break even in ${Math.ceil(calculation.roi.paybackPeriodMonths)} months`,
      `  • You gain ${calculation.businessImpact.equivalentFullTimeEmployees.toFixed(1)} FTEs worth of productivity`,
      `  • You reduce billing errors by ${calculation.businessImpact.errorReductionPercentage}%`,
      `═══════════════════════════════════════════════════════════`,
    );

    return lines.join('\n');
  }
}

// Example hotel profiles
export const exampleProfiles: { [key: string]: HotelProfile } = {
  boutiqueHotel: {
    name: 'Boutique Hotel (40 rooms)',
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
      barEquipmentName: 'iPourIt Self-Serve Beer Wall',
    },
  },

  businessHotel: {
    name: 'Business Hotel (120 rooms)',
    roomCount: 120,
    averageOccupancy: 80,
    staffCount: 45,
    averageStaffHourlyRate: 20,
    manualDataEntry: {
      pmsToPosDaily: 3.0,
      posToAccountingDaily: 3.5,
      wifiGuestTrackingManual: 2.0,
      barInventoryReconciliation: 1.5,
      roomChargeCorrections: 2.5,
    },
    currentErrorRates: {
      billingErrorsPerMonth: 60,
      averageErrorCost: 40,
    },
    existingSystems: {
      hasPMS: true,
      pmsName: 'Oracle OPERA',
      hasPOS: true,
      posName: 'MICROS',
      hasUniFiWiFi: true,
      hasBarEquipment: false,
    },
  },

  independentHotel: {
    name: 'Independent Hotel (25 rooms)',
    roomCount: 25,
    averageOccupancy: 65,
    staffCount: 8,
    averageStaffHourlyRate: 16,
    manualDataEntry: {
      pmsToPosDaily: 1.0,
      posToAccountingDaily: 1.5,
      wifiGuestTrackingManual: 0.5,
      barInventoryReconciliation: 1.0,
      roomChargeCorrections: 1.0,
    },
    currentErrorRates: {
      billingErrorsPerMonth: 15,
      averageErrorCost: 30,
    },
    existingSystems: {
      hasPMS: true,
      pmsName: 'Mews',
      hasPOS: true,
      posName: 'Square',
      hasUniFiWiFi: false,
      hasBarEquipment: false,
    },
  },
};
