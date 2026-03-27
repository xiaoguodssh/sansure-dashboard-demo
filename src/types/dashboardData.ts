export interface TrendPoint {
  month: string;
  revenueRate: number;
  profitRate: number;
  operatingCashFlow: number;
  collectionRate: number;
  rdMilestoneRate: number;
}

type NumOrNull = number | null;

export interface OverviewData {
  kpis: {
    revenueRate: number;
    profitRate: number;
    operatingCashFlow: number;
    collectionRate: number;
    rdMilestoneRate: number;
  };
  trend: TrendPoint[];
  contribution: Array<{ name: string; value: number }>;
  anomalies: Array<{
    module: string;
    org: string;
    metric: string;
    value: number;
    threshold: string;
    level: '红' | '黄' | '绿';
    reason: string;
  }>;
  strategy: {
    northStar: {
      name: string;
      description: string;
      unit: string;
      current: number;
      target: number;
    };
    dimensions: Array<{
      key: 'growth' | 'profit' | 'cash' | 'capability';
      name: string;
      objective: string;
      weight: number;
      kpis: Array<{
        name: string;
        unit: '%' | '百万元' | '分';
        current: number;
        target: number;
        route: string;
      }>;
    }>;
  };
}

export interface SalesData {
  domesticLines: Array<{
    line: string;
    category: string;
    monthSales: NumOrNull;
    monthTarget: NumOrNull;
    monthAchieveRate: NumOrNull;
    ytdSales: NumOrNull;
    ytdTarget: NumOrNull;
    ytdAchieveRate: NumOrNull;
  }>;
  domesticRegions: Array<{
    category: string;
    region: string;
    monthTarget: NumOrNull;
    monthSales: NumOrNull;
    monthAchieveRate: NumOrNull;
    monthYoy: NumOrNull;
    ytdTarget: NumOrNull;
    ytdSales: NumOrNull;
    ytdAchieveRate: NumOrNull;
    ytdYoy: NumOrNull;
  }>;
  domesticProvinces: Array<{
    category: string;
    region: string;
    monthTarget: NumOrNull;
    monthSales: NumOrNull;
    monthAchieveRate: NumOrNull;
    monthYoy: NumOrNull;
    ytdTarget: NumOrNull;
    ytdSales: NumOrNull;
    ytdAchieveRate: NumOrNull;
    ytdYoy: NumOrNull;
  }>;
  internationalRegions: Array<{
    group: string;
    region: string;
    monthSales: NumOrNull;
    monthTarget: NumOrNull;
    monthAchieveRate: NumOrNull;
    monthYoy: NumOrNull;
    ytdSales: NumOrNull;
    ytdTarget: NumOrNull;
    ytdAchieveRate: NumOrNull;
    ytdYoy: NumOrNull;
  }>;
  regionMappings: Array<{ region: string; regionGroup: string; effectiveFrom: string }>;
  subsidiaries: Array<{
    company: string;
    monthSales: NumOrNull;
    monthTarget: NumOrNull;
    ytdSales: NumOrNull;
    ytdTarget: NumOrNull;
  }>;
  grossMargins: Array<{
    scope: string;
    category: string;
    income: NumOrNull;
    cost: NumOrNull;
    predictedGrossMargin: NumOrNull;
    actualIncome: NumOrNull;
    actualCost: NumOrNull;
    actualGrossMargin: NumOrNull;
    deviation: NumOrNull;
  }>;
  receivableStat: Array<{
    department: string;
    systemAmount: NumOrNull;
    manualAmount: NumOrNull;
    totalAmount: NumOrNull;
    momGrowth: NumOrNull;
    yoyGrowth: NumOrNull;
    ytdAmount: NumOrNull;
    ytdYoyGrowth: NumOrNull;
  }>;
  receivableMonthly: Array<{ month: string; amount: NumOrNull }>;
}

export interface RdData {
  kpis: {
    activeProjects: number;
    milestoneOnTimeRate: number;
    budgetExecutionRate: number;
    registrationNodeOnTimeRate: number;
  };
  milestoneTrend: Array<{
    month: string;
    planned: number;
    completed: number;
    completionRate: number;
  }>;
  stageDistribution: Array<{
    stage: string;
    count: number;
  }>;
  projects: Array<{
    project: string;
    stage: string;
    budget: number;
    actual: number;
    progress: number;
    risk: number;
  }>;
}

export interface HrEfficiencyEmployee {
  id: string;
  name: string;
  score: number;
  department: string;
  position: string;
}

export interface HrEfficiencyDepartment {
  id: string;
  name: string;
  score: number;
  employeeCount: number;
  employees: HrEfficiencyEmployee[];
}

export interface HrEfficiencyData {
  companyScore: number;
  departments: HrEfficiencyDepartment[];
}

export interface HrData {
  kpis: {
    totalHeadcount: number;
    keyTalentRate: number;
    monthlyTurnoverRate: number;
    revenuePerCapita: number;
  };
  headcountTrend: Array<{
    month: string;
    headcount: number;
    keyTalent: number;
    revenuePerCapita: number;
  }>;
  departmentStructure: Array<{
    department: string;
    headcount: number;
    target: number;
    turnoverRate: number;
  }>;
  efficiency: HrEfficiencyData;
}

export interface DivisionData {
  overview: {
    sampleCount: number;
    experimentCount: number;
    experimentAnalysisCount: number;
    qcResultCount: number;
    reportCount: number;
    patientCount: number;
    pathogenCount: number;
    cdcPointCount: number;
    jdSampleCount: number;
  };
  sheetVolumes: Array<{
    sheet: string;
    domain: string;
    tableName: string;
    totalRows: number;
    exportRows: number;
  }>;
  sampleTypeDist: Array<{ name: string; count: number }>;
  detectionResultDist: Array<{ name: string; count: number }>;
  experimentTypeDist: Array<{ name: string; count: number }>;
  experimentStatusDist: Array<{ name: string; count: number }>;
  qcResultDist: Array<{ name: string; count: number }>;
  qcValueTypeDist: Array<{ name: string; count: number }>;
  reportTypeDist: Array<{ name: string; count: number }>;
  reportStatusDist: Array<{ name: string; count: number }>;
  patientSexDist: Array<{ name: string; count: number }>;
  patientAgeDist: Array<{ name: string; count: number }>;
  patientRegionDist: Array<{ name: string; count: number }>;
  pathogenClassDist: Array<{ name: string; count: number }>;
  pathogenRiskDist: Array<{ name: string; count: number }>;
  cdcPointTypeDist: Array<{ name: string; count: number }>;
  cdcRegionDist: Array<{ name: string; count: number }>;
  jdDetectionTypeDist: Array<{ name: string; count: number }>;
  jdSampleTypeDist: Array<{ name: string; count: number }>;
  jdReportStatusDist: Array<{ name: string; count: number }>;
}

export interface FinanceData {
  kpis: {
    revenue: number;
    cost: number;
    grossProfit: number;
    grossMarginRate: number;
    profitRate: number;
    operatingCashFlow: number;
    collectionRate: number;
  };
  monthly: Array<{
    month: string;
    revenue: number;
    cost: number;
    grossProfit: number;
    grossMarginRate: number;
    receivable: number;
    collectionRate: number;
    operatingCashFlow: number;
  }>;
}

export interface DashboardData {
  meta: {
    generatedAt: string;
    startMonth: string;
    latestMonth: string;
    note: string;
  };
  overview: OverviewData;
  sales: SalesData;
  finance: FinanceData;
  rd: RdData;
  hr: HrData;
  division: DivisionData;
  alerts: Array<{
    module: string;
    org: string;
    metric: string;
    value: number;
    threshold: string;
    level: '红' | '黄' | '绿';
    reason: string;
  }>;
}
