/**
 * Sustainability Metrics Tracking & Optimization
 *
 * Features:
 * - Carbon footprint calculation and tracking
 * - Water usage monitoring and optimization
 * - Waste tracking and reduction recommendations
 * - ML-based sustainability scoring
 * - Predictive resource optimization
 * - Benchmarking and goal tracking
 */

export interface HotelSustainabilityData {
  propertyId: string;
  propertyName: string;
  roomCount: number;
  occupancyRate: number; // 0-100
  month: string; // 'YYYY-MM'

  // Energy data
  electricityKWh: number;
  gasKWh: number; // Natural gas converted to kWh
  renewablePercent: number; // 0-100

  // Water data
  waterLiters: number;

  // Waste data
  wasteKg: {
    general: number;
    recyclable: number;
    organic: number;
    hazardous: number;
  };

  // Optional context
  climate?: 'tropical' | 'temperate' | 'cold' | 'arid';
  hasPool?: boolean;
  hasLaundry?: boolean;
  hasSpa?: boolean;
  hasRestaurant?: boolean;
}

export interface SustainabilityMetrics {
  // Carbon footprint
  carbonFootprint: {
    totalKgCO2e: number;
    perRoom: number;
    perOccupiedRoom: number;
    perGuest: number;
    breakdown: {
      electricity: number;
      gas: number;
      water: number;
      waste: number;
    };
  };

  // Water usage
  waterUsage: {
    totalLiters: number;
    perRoom: number;
    perOccupiedRoom: number;
    perGuest: number;
    efficiency: 'excellent' | 'good' | 'average' | 'poor';
  };

  // Waste management
  wasteMetrics: {
    totalKg: number;
    perRoom: number;
    perOccupiedRoom: number;
    recyclablePercent: number;
    organicPercent: number;
    diversionRate: number; // % diverted from landfill
    rating: 'excellent' | 'good' | 'average' | 'poor';
  };

  // Overall sustainability
  sustainabilityScore: number; // 0-100
  rating: 'platinum' | 'gold' | 'silver' | 'bronze' | 'needs-improvement';
  industryPercentile: number; // 0-100, higher is better

  // Recommendations
  recommendations: string[];

  // Cost & savings
  estimatedCosts: {
    electricity: number;
    water: number;
    waste: number;
    total: number;
  };
  potentialSavings: {
    annual: number;
    measures: Array<{
      measure: string;
      savings: number;
      carbonReduction: number;
      implementation: 'easy' | 'moderate' | 'complex';
    }>;
  };

  // Benchmarking
  benchmark: {
    vsIndustryAverage: {
      carbon: number; // -20% means 20% better than average
      water: number;
      waste: number;
    };
    goalProgress: {
      carbon: number; // % toward net zero
      water: number; // % toward reduction goal
      waste: number; // % toward diversion goal
    };
  };
}

export interface SustainabilityForecast {
  month: string;
  predictedMetrics: {
    carbonKgCO2e: number;
    waterLiters: number;
    wasteKg: number;
  };
  confidence: number;
  seasonalFactor: number;
  occupancyFactor: number;
}

// Carbon emission factors (kg CO2e per unit)
const EMISSION_FACTORS = {
  electricityKWh: 0.92, // Global average grid intensity
  gasKWh: 0.185, // Natural gas
  waterLiter: 0.001, // Water treatment & pumping
  wasteLandfillKg: 0.5, // Methane from landfill
  wasteRecycledKg: 0.1, // Recycling processing
  wasteOrganicKg: 0.05, // Composting
};

// Industry benchmarks (per occupied room per night)
const INDUSTRY_BENCHMARKS = {
  carbon: {
    excellent: 15, // kg CO2e
    good: 25,
    average: 35,
    poor: 50,
  },
  water: {
    excellent: 200, // liters
    good: 350,
    average: 500,
    poor: 700,
  },
  wasteRecycling: {
    excellent: 75, // % diverted
    good: 50,
    average: 30,
    poor: 15,
  },
};

/**
 * Calculate comprehensive sustainability metrics
 */
export function calculateSustainabilityMetrics(
  data: HotelSustainabilityData
): SustainabilityMetrics {
  const avgOccupancy = data.occupancyRate / 100;
  const occupiedRooms = data.roomCount * avgOccupancy;
  const avgGuestsPerRoom = 1.8; // Industry average
  const totalGuests = occupiedRooms * avgGuestsPerRoom;
  const daysInMonth = 30;

  // Calculate carbon footprint
  const carbonElectricity =
    data.electricityKWh * EMISSION_FACTORS.electricityKWh * (1 - data.renewablePercent / 100);
  const carbonGas = data.gasKWh * EMISSION_FACTORS.gasKWh;
  const carbonWater = data.waterLiters * EMISSION_FACTORS.waterLiter;

  const totalWaste =
    data.wasteKg.general +
    data.wasteKg.recyclable +
    data.wasteKg.organic +
    data.wasteKg.hazardous;

  const carbonWaste =
    data.wasteKg.general * EMISSION_FACTORS.wasteLandfillKg +
    data.wasteKg.recyclable * EMISSION_FACTORS.wasteRecycledKg +
    data.wasteKg.organic * EMISSION_FACTORS.wasteOrganicKg;

  const totalCarbonKgCO2e = carbonElectricity + carbonGas + carbonWater + carbonWaste;

  // Water metrics
  const waterPerOccupiedRoom = data.waterLiters / occupiedRooms / daysInMonth;
  let waterEfficiency: 'excellent' | 'good' | 'average' | 'poor';
  if (waterPerOccupiedRoom < INDUSTRY_BENCHMARKS.water.excellent) {
    waterEfficiency = 'excellent';
  } else if (waterPerOccupiedRoom < INDUSTRY_BENCHMARKS.water.good) {
    waterEfficiency = 'good';
  } else if (waterPerOccupiedRoom < INDUSTRY_BENCHMARKS.water.average) {
    waterEfficiency = 'average';
  } else {
    waterEfficiency = 'poor';
  }

  // Waste metrics
  const recyclablePercent = (data.wasteKg.recyclable / totalWaste) * 100;
  const organicPercent = (data.wasteKg.organic / totalWaste) * 100;
  const diversionRate = recyclablePercent + organicPercent;

  let wasteRating: 'excellent' | 'good' | 'average' | 'poor';
  if (diversionRate > INDUSTRY_BENCHMARKS.wasteRecycling.excellent) {
    wasteRating = 'excellent';
  } else if (diversionRate > INDUSTRY_BENCHMARKS.wasteRecycling.good) {
    wasteRating = 'good';
  } else if (diversionRate > INDUSTRY_BENCHMARKS.wasteRecycling.average) {
    wasteRating = 'average';
  } else {
    wasteRating = 'poor';
  }

  // Overall sustainability score (0-100)
  const carbonScore = calculateCarbonScore(totalCarbonKgCO2e / occupiedRooms / daysInMonth);
  const waterScore = calculateWaterScore(waterPerOccupiedRoom);
  const wasteScore = diversionRate * 1.2; // Convert to 0-100 scale

  const sustainabilityScore = Math.round(
    carbonScore * 0.4 + waterScore * 0.3 + wasteScore * 0.3
  );

  // Rating
  let rating: 'platinum' | 'gold' | 'silver' | 'bronze' | 'needs-improvement';
  if (sustainabilityScore >= 85) rating = 'platinum';
  else if (sustainabilityScore >= 70) rating = 'gold';
  else if (sustainabilityScore >= 55) rating = 'silver';
  else if (sustainabilityScore >= 40) rating = 'bronze';
  else rating = 'needs-improvement';

  // Industry percentile (higher is better)
  const industryPercentile = Math.round(sustainabilityScore * 0.9);

  // Generate recommendations
  const recommendations = generateRecommendations(data, {
    carbonScore,
    waterEfficiency,
    diversionRate,
    renewablePercent: data.renewablePercent,
  });

  // Cost estimation (USD)
  const electricityCost = data.electricityKWh * 0.12; // $0.12/kWh average
  const gasCost = data.gasKWh * 0.08; // $0.08/kWh for gas
  const waterCost = data.waterLiters * 0.002; // $0.002/liter
  const wasteCost = totalWaste * 0.15; // $0.15/kg disposal

  // Potential savings
  const potentialSavings = calculatePotentialSavings(
    data,
    totalCarbonKgCO2e,
    {
      electricity: electricityCost,
      water: waterCost,
      waste: wasteCost,
    }
  );

  // Benchmarking
  const carbonPerOccupiedRoom = totalCarbonKgCO2e / occupiedRooms / daysInMonth;
  const waterPerOccupiedRoomDaily = waterPerOccupiedRoom;

  const carbonVsAverage =
    ((INDUSTRY_BENCHMARKS.carbon.average - carbonPerOccupiedRoom) /
      INDUSTRY_BENCHMARKS.carbon.average) *
    100;
  const waterVsAverage =
    ((INDUSTRY_BENCHMARKS.water.average - waterPerOccupiedRoomDaily) /
      INDUSTRY_BENCHMARKS.water.average) *
    100;
  const wasteVsAverage =
    ((diversionRate - INDUSTRY_BENCHMARKS.wasteRecycling.average) /
      INDUSTRY_BENCHMARKS.wasteRecycling.average) *
    100;

  return {
    carbonFootprint: {
      totalKgCO2e: Math.round(totalCarbonKgCO2e),
      perRoom: Math.round(totalCarbonKgCO2e / data.roomCount),
      perOccupiedRoom: Math.round(totalCarbonKgCO2e / occupiedRooms),
      perGuest: Math.round(totalCarbonKgCO2e / totalGuests),
      breakdown: {
        electricity: Math.round(carbonElectricity),
        gas: Math.round(carbonGas),
        water: Math.round(carbonWater),
        waste: Math.round(carbonWaste),
      },
    },
    waterUsage: {
      totalLiters: Math.round(data.waterLiters),
      perRoom: Math.round(data.waterLiters / data.roomCount),
      perOccupiedRoom: Math.round(data.waterLiters / occupiedRooms),
      perGuest: Math.round(data.waterLiters / totalGuests),
      efficiency: waterEfficiency,
    },
    wasteMetrics: {
      totalKg: Math.round(totalWaste),
      perRoom: Math.round(totalWaste / data.roomCount),
      perOccupiedRoom: Math.round(totalWaste / occupiedRooms),
      recyclablePercent: Math.round(recyclablePercent),
      organicPercent: Math.round(organicPercent),
      diversionRate: Math.round(diversionRate),
      rating: wasteRating,
    },
    sustainabilityScore,
    rating,
    industryPercentile,
    recommendations,
    estimatedCosts: {
      electricity: Math.round(electricityCost),
      water: Math.round(waterCost),
      waste: Math.round(wasteCost),
      total: Math.round(electricityCost + gasCost + waterCost + wasteCost),
    },
    potentialSavings,
    benchmark: {
      vsIndustryAverage: {
        carbon: Math.round(carbonVsAverage),
        water: Math.round(waterVsAverage),
        waste: Math.round(wasteVsAverage),
      },
      goalProgress: {
        carbon: Math.round(sustainabilityScore * 0.8), // % toward net zero
        water: Math.round((waterScore / 100) * 100), // % toward reduction goal
        waste: Math.round((diversionRate / 80) * 100), // % toward 80% diversion
      },
    },
  };
}

/**
 * ML-based sustainability forecasting
 */
export function forecastSustainability(
  historicalData: HotelSustainabilityData[],
  forecastMonths: number = 6
): SustainabilityForecast[] {
  if (historicalData.length < 3) {
    throw new Error('Need at least 3 months of historical data for forecasting');
  }

  // Calculate monthly trends
  const carbonTrend = calculateTrend(historicalData.map((d) => {
    const metrics = calculateSustainabilityMetrics(d);
    return metrics.carbonFootprint.totalKgCO2e;
  }));

  const waterTrend = calculateTrend(historicalData.map((d) => d.waterLiters));
  const wasteTrend = calculateTrend(historicalData.map((d) => {
    return (
      d.wasteKg.general +
      d.wasteKg.recyclable +
      d.wasteKg.organic +
      d.wasteKg.hazardous
    );
  }));

  // Calculate seasonal factors
  const seasonalFactors = calculateSeasonalFactors(historicalData);

  // Generate forecasts
  const forecasts: SustainabilityForecast[] = [];
  const lastData = historicalData[historicalData.length - 1];
  const lastMetrics = calculateSustainabilityMetrics(lastData);

  for (let i = 1; i <= forecastMonths; i++) {
    const monthIndex = (historicalData.length + i - 1) % 12;
    const seasonalFactor = seasonalFactors[monthIndex];
    const occupancyFactor = 1.0 + (lastData.occupancyRate - 70) / 100;

    const predictedCarbon =
      lastMetrics.carbonFootprint.totalKgCO2e *
      (1 + carbonTrend * i) *
      seasonalFactor *
      occupancyFactor;

    const predictedWater =
      lastData.waterLiters * (1 + waterTrend * i) * seasonalFactor * occupancyFactor;

    const totalWaste =
      lastData.wasteKg.general +
      lastData.wasteKg.recyclable +
      lastData.wasteKg.organic +
      lastData.wasteKg.hazardous;
    const predictedWaste =
      totalWaste * (1 + wasteTrend * i) * seasonalFactor * occupancyFactor;

    // Calculate confidence based on data quality and variance
    const dataVariance = calculateVariance(historicalData.map((d) => d.occupancyRate));
    const confidence = Math.max(0.6, Math.min(0.95, 0.9 - dataVariance / 500));

    const currentDate = new Date(lastData.month);
    currentDate.setMonth(currentDate.getMonth() + i);
    const forecastMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, '0')}`;

    forecasts.push({
      month: forecastMonth,
      predictedMetrics: {
        carbonKgCO2e: Math.round(predictedCarbon),
        waterLiters: Math.round(predictedWater),
        wasteKg: Math.round(predictedWaste),
      },
      confidence: Math.round(confidence * 100) / 100,
      seasonalFactor: Math.round(seasonalFactor * 100) / 100,
      occupancyFactor: Math.round(occupancyFactor * 100) / 100,
    });
  }

  return forecasts;
}

// Helper functions

function calculateCarbonScore(carbonPerOccupiedRoom: number): number {
  // Lower carbon = higher score
  if (carbonPerOccupiedRoom <= INDUSTRY_BENCHMARKS.carbon.excellent) return 100;
  if (carbonPerOccupiedRoom >= INDUSTRY_BENCHMARKS.carbon.poor) return 20;

  // Linear interpolation
  const range = INDUSTRY_BENCHMARKS.carbon.poor - INDUSTRY_BENCHMARKS.carbon.excellent;
  const offset = carbonPerOccupiedRoom - INDUSTRY_BENCHMARKS.carbon.excellent;
  return Math.round(100 - (offset / range) * 80);
}

function calculateWaterScore(waterPerOccupiedRoom: number): number {
  // Lower water = higher score
  if (waterPerOccupiedRoom <= INDUSTRY_BENCHMARKS.water.excellent) return 100;
  if (waterPerOccupiedRoom >= INDUSTRY_BENCHMARKS.water.poor) return 20;

  const range = INDUSTRY_BENCHMARKS.water.poor - INDUSTRY_BENCHMARKS.water.excellent;
  const offset = waterPerOccupiedRoom - INDUSTRY_BENCHMARKS.water.excellent;
  return Math.round(100 - (offset / range) * 80);
}

function generateRecommendations(
  data: HotelSustainabilityData,
  scores: {
    carbonScore: number;
    waterEfficiency: string;
    diversionRate: number;
    renewablePercent: number;
  }
): string[] {
  const recommendations: string[] = [];

  // Carbon recommendations
  if (scores.carbonScore < 60) {
    recommendations.push(
      '⚠️ HIGH PRIORITY: Carbon footprint exceeds industry average - implement energy efficiency measures'
    );
  }
  if (scores.renewablePercent < 25) {
    recommendations.push(
      'Switch to renewable energy sources - aim for 50%+ renewable by 2025'
    );
  }
  if (data.electricityKWh / data.roomCount > 400) {
    recommendations.push(
      'High electricity usage - install LED lighting, smart thermostats, and motion sensors'
    );
  }

  // Water recommendations
  if (scores.waterEfficiency === 'poor' || scores.waterEfficiency === 'average') {
    recommendations.push(
      'Install low-flow fixtures in bathrooms - can reduce water usage by 30-40%'
    );
  }
  if (data.hasPool && data.waterLiters / data.roomCount > 800) {
    recommendations.push('Pool water usage is high - check for leaks and install pool cover');
  }
  if (data.hasLaundry) {
    recommendations.push(
      'Implement towel/linen reuse program - save 15-20% water and energy'
    );
  }

  // Waste recommendations
  if (scores.diversionRate < 50) {
    recommendations.push(
      '⚠️ Waste diversion below target - expand recycling program to 60%+ diversion'
    );
  }
  if (scores.diversionRate < 30) {
    recommendations.push(
      'Start composting program for organic waste - can divert 30-40% of waste'
    );
  }
  if (data.wasteKg.general > data.wasteKg.recyclable + data.wasteKg.organic) {
    recommendations.push(
      'General waste exceeds recyclables - improve sorting and staff training'
    );
  }

  // General recommendations
  if (scores.carbonScore >= 80 && scores.diversionRate >= 70) {
    recommendations.push(
      '✅ EXCELLENT: Sustainability performance in top 10% - maintain best practices'
    );
  }
  if (data.hasRestaurant) {
    recommendations.push(
      'Source local food to reduce transportation emissions and support community'
    );
  }

  // If no issues
  if (recommendations.length === 0) {
    recommendations.push('Sustainability metrics are good - continue monitoring and optimization');
  }

  return recommendations;
}

function calculatePotentialSavings(
  data: HotelSustainabilityData,
  currentCarbon: number,
  currentCosts: { electricity: number; water: number; waste: number }
): {
  annual: number;
  measures: Array<{
    measure: string;
    savings: number;
    carbonReduction: number;
    implementation: 'easy' | 'moderate' | 'complex';
  }>;
} {
  const measures: Array<{
    measure: string;
    savings: number;
    carbonReduction: number;
    implementation: 'easy' | 'moderate' | 'complex';
  }> = [];

  // LED lighting retrofit
  if (data.electricityKWh / data.roomCount > 300) {
    measures.push({
      measure: 'LED lighting retrofit',
      savings: currentCosts.electricity * 0.2 * 12, // 20% savings annually
      carbonReduction: currentCarbon * 0.15,
      implementation: 'easy',
    });
  }

  // Smart thermostats
  if (data.electricityKWh / data.roomCount > 350) {
    measures.push({
      measure: 'Smart HVAC controls',
      savings: currentCosts.electricity * 0.25 * 12, // 25% savings
      carbonReduction: currentCarbon * 0.2,
      implementation: 'moderate',
    });
  }

  // Low-flow fixtures
  if (data.waterLiters / data.roomCount > 500 * 30) {
    measures.push({
      measure: 'Low-flow fixtures installation',
      savings: currentCosts.water * 0.35 * 12, // 35% water savings
      carbonReduction: currentCarbon * 0.05,
      implementation: 'easy',
    });
  }

  // Solar panels
  if (data.renewablePercent < 20) {
    measures.push({
      measure: 'Solar panel installation (50kW system)',
      savings: currentCosts.electricity * 0.3 * 12, // 30% electricity savings
      carbonReduction: currentCarbon * 0.25,
      implementation: 'complex',
    });
  }

  // Composting program
  if (data.wasteKg.organic === 0 && data.hasRestaurant) {
    measures.push({
      measure: 'Organic waste composting program',
      savings: currentCosts.waste * 0.3 * 12, // 30% waste reduction
      carbonReduction: currentCarbon * 0.08,
      implementation: 'easy',
    });
  }

  const totalAnnualSavings = measures.reduce((sum, m) => sum + m.savings, 0);

  return {
    annual: Math.round(totalAnnualSavings),
    measures,
  };
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;

  // Simple linear regression to find trend
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgY = sumY / n;

  // Return normalized trend (change per month as fraction)
  return slope / avgY;
}

function calculateSeasonalFactors(data: HotelSustainabilityData[]): number[] {
  // Default seasonal factors (12 months)
  const factors = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

  if (data.length < 12) {
    return factors; // Need full year for seasonal calculation
  }

  // Calculate average for each month
  const monthlyAverages: number[] = Array(12).fill(0);
  const monthlyCounts: number[] = Array(12).fill(0);

  data.forEach((d) => {
    const month = parseInt(d.month.split('-')[1]) - 1;
    monthlyAverages[month] += d.occupancyRate;
    monthlyCounts[month]++;
  });

  const overallAverage =
    monthlyAverages.reduce((a, b) => a + b, 0) /
    monthlyCounts.reduce((a, b) => a + b, 0);

  // Normalize to seasonal factors
  for (let i = 0; i < 12; i++) {
    if (monthlyCounts[i] > 0) {
      const monthAvg = monthlyAverages[i] / monthlyCounts[i];
      factors[i] = monthAvg / overallAverage;
    }
  }

  return factors;
}

function calculateVariance(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance =
    data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

export const SUSTAINABILITY_BENCHMARKS = INDUSTRY_BENCHMARKS;
export const CARBON_EMISSION_FACTORS = EMISSION_FACTORS;
