/**
 * ROI Calculator Demo
 *
 * Shows the business value of middleware integration for different hotel types
 */

import { ROICalculator, exampleProfiles } from '../lib/business-value/roi-calculator';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     💰 HOSPITALITY MIDDLEWARE - ROI CALCULATOR 💰         ║');
  console.log('║                                                            ║');
  console.log('║  Showing Business Value of ISV/SI Integration Platform    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const calculator = new ROICalculator();

  // Demo 1: Boutique Hotel with Bar Equipment (HIGH VALUE)
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('DEMO 1: BOUTIQUE HOTEL WITH BAR EQUIPMENT\n');
  console.log('Scenario: 40-room boutique hotel with iPourIt beer wall');
  console.log('Client already has: Cloudbeds PMS, Toast POS, UniFi WiFi, iPourIt\n');

  const boutiqueResult = calculator.calculateROI(exampleProfiles.boutiqueHotel);
  const boutiqueSummary = calculator.generateSummary(exampleProfiles.boutiqueHotel, boutiqueResult);
  console.log(boutiqueSummary);

  console.log('\n\n');

  // Demo 2: Business Hotel (MEDIUM VALUE)
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('DEMO 2: BUSINESS HOTEL (NO BAR EQUIPMENT)\n');
  console.log('Scenario: 120-room business hotel, conference center');
  console.log('Client already has: Oracle OPERA PMS, MICROS POS, UniFi WiFi\n');

  const businessResult = calculator.calculateROI(exampleProfiles.businessHotel);
  const businessSummary = calculator.generateSummary(exampleProfiles.businessHotel, businessResult);
  console.log(businessSummary);

  console.log('\n\n');

  // Demo 3: Independent Hotel (BASIC VALUE)
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('DEMO 3: INDEPENDENT HOTEL (BASIC INTEGRATION)\n');
  console.log('Scenario: 25-room independent hotel');
  console.log('Client already has: Mews PMS, Square POS (no UniFi, no bar equipment)\n');

  const independentResult = calculator.calculateROI(exampleProfiles.independentHotel);
  const independentSummary = calculator.generateSummary(exampleProfiles.independentHotel, independentResult);
  console.log(independentSummary);

  console.log('\n\n');

  // Comparison Table
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  COMPARISON SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('┌────────────────────────────┬──────────────┬──────────────┬──────────────┐');
  console.log('│ Metric                     │ Boutique     │ Business     │ Independent  │');
  console.log('├────────────────────────────┼──────────────┼──────────────┼──────────────┤');
  console.log(
    `│ Rooms                      │ ${pad(exampleProfiles.boutiqueHotel.roomCount)} │ ${pad(exampleProfiles.businessHotel.roomCount)} │ ${pad(exampleProfiles.independentHotel.roomCount)} │`
  );
  console.log(
    `│ Monthly License            │ $${pad(boutiqueResult.platformCost.monthlyLicense)} │ $${pad(businessResult.platformCost.monthlyLicense)} │ $${pad(independentResult.platformCost.monthlyLicense)} │`
  );
  console.log(
    `│ Setup Cost                 │ $${pad(boutiqueResult.platformCost.integrationSetupCost)} │ $${pad(businessResult.platformCost.integrationSetupCost)} │ $${pad(independentResult.platformCost.integrationSetupCost)} │`
  );
  console.log('├────────────────────────────┼──────────────┼──────────────┼──────────────┤');
  console.log(
    `│ Hours Saved (Monthly)      │ ${pad(boutiqueResult.timeSavings.hoursPerMonth.toFixed(0))} hrs │ ${pad(businessResult.timeSavings.hoursPerMonth.toFixed(0))} hrs │ ${pad(independentResult.timeSavings.hoursPerMonth.toFixed(0))} hrs │`
  );
  console.log(
    `│ Labor Savings (Monthly)    │ $${pad(boutiqueResult.costSavings.laborSavingsMonthly.toFixed(0))} │ $${pad(businessResult.costSavings.laborSavingsMonthly.toFixed(0))} │ $${pad(independentResult.costSavings.laborSavingsMonthly.toFixed(0))} │`
  );
  console.log(
    `│ Total Savings (Yearly)     │ $${pad(boutiqueResult.costSavings.totalSavingsYearly.toFixed(0))} │ $${pad(businessResult.costSavings.totalSavingsYearly.toFixed(0))} │ $${pad(independentResult.costSavings.totalSavingsYearly.toFixed(0))} │`
  );
  console.log('├────────────────────────────┼──────────────┼──────────────┼──────────────┤');
  console.log(
    `│ Net Savings (Monthly)      │ $${pad(boutiqueResult.roi.netSavingsMonthly.toFixed(0))} │ $${pad(businessResult.roi.netSavingsMonthly.toFixed(0))} │ $${pad(independentResult.roi.netSavingsMonthly.toFixed(0))} │`
  );
  console.log(
    `│ ROI (First Year)           │ ${pad(boutiqueResult.roi.roiPercentage.toFixed(0))}% │ ${pad(businessResult.roi.roiPercentage.toFixed(0))}% │ ${pad(independentResult.roi.roiPercentage.toFixed(0))}% │`
  );
  console.log(
    `│ Payback Period             │ ${pad(boutiqueResult.roi.paybackPeriodMonths.toFixed(1))} mo │ ${pad(businessResult.roi.paybackPeriodMonths.toFixed(1))} mo │ ${pad(independentResult.roi.paybackPeriodMonths.toFixed(1))} mo │`
  );
  console.log(
    `│ Equivalent FTEs Freed      │ ${pad(boutiqueResult.businessImpact.equivalentFullTimeEmployees.toFixed(1))} │ ${pad(businessResult.businessImpact.equivalentFullTimeEmployees.toFixed(1))} │ ${pad(independentResult.businessImpact.equivalentFullTimeEmployees.toFixed(1))} │`
  );
  console.log('└────────────────────────────┴──────────────┴──────────────┴──────────────┘');

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                   KEY INSIGHTS                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('1. 💡 CLIENT-DRIVEN VALUE:');
  console.log('   Boutique hotel has bar equipment → 85% automation on inventory');
  console.log('   Business hotel has NO bar equipment → 30% automation (less value)');
  console.log('   → We integrate what they HAVE, we don\'t sell hardware\n');

  console.log('2. 📊 PAYBACK PERIOD:');
  console.log('   All hotels break even in <1 month (0.6-0.8 months)');
  console.log('   → Clear ROI for any hotel with PMS + POS\n');

  console.log('3. 🎯 EQUIVALENT FTEs:');
  console.log('   Boutique: 1.62 FTEs freed (259 hrs/mo saved)');
  console.log('   Business: 2.54 FTEs freed (407 hrs/mo saved)');
  console.log('   Independent: 0.91 FTEs freed (146 hrs/mo saved)');
  console.log('   → Staff can focus on guests, not data entry\n');

  console.log('4. 💰 COST MODEL (ISV/SI, NOT VAR):');
  console.log('   We charge: $50-150/month + $1,500-2,500 setup');
  console.log('   We DON\'T charge: Per-room fees (unlike Oracle/Mews)');
  console.log('   We DON\'T sell: Hardware (not a VAR)\n');

  console.log('5. 🔐 COMPETITIVE PROTECTION:');
  console.log('   Public: "We integrate PMS, POS, WiFi"');
  console.log('   Private: "If you have bar equipment, we integrate it"');
  console.log('   → NEVER tell vendors what they\'re missing\n');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SALES PITCH                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('WRONG (VAR Model):');
  console.log('❌ "You should buy iPourIt beer wall. We integrate with it!"\n');

  console.log('RIGHT (ISV/SI Model):');
  console.log('✅ "What systems do you currently have?"');
  console.log('   → "Cloudbeds PMS, Toast POS, iPourIt beer wall"');
  console.log('   → "Perfect! We\'ll connect them. No more double-entry."');
  console.log('   → "You\'ll save $4,658/month, break even in 0.6 months."\n');

  console.log('═══════════════════════════════════════════════════════════\n');
}

function pad(value: string | number, width: number = 10): string {
  const str = String(value);
  if (str.length >= width) return str;
  return str + ' '.repeat(width - str.length);
}

main().catch(console.error);
