import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

export interface IndicatorInfo {
  definition: string;
  formula: string;
  isAtomic?: boolean;
}

export function IndicatorTooltip({ definition, formula }: IndicatorInfo) {
  return (
    <Tooltip
      title={
        <div>
          <div style={{ marginBottom: 8 }}>
            <strong>定义：</strong>
            {definition}
          </div>
          <div>
            <strong>计算公式：</strong>
            <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>
              {formula}
            </code>
          </div>
        </div>
      }
    >
      <QuestionCircleOutlined style={{ marginLeft: 4, cursor: 'help', color: '#999' }} />
    </Tooltip>
  );
}

export const indicatorDefinitions: Record<string, IndicatorInfo> = {
  revenueRate: {
    definition: '实际营业收入占目标的比率，衡量收入目标完成情况',
    formula: '(实际营业收入 / 目标营业收入) × 100%',
  },
  profitRate: {
    definition: '净利润占营业收入的比例，衡量整体盈利能力',
    formula: '净利润 / 营业收入 × 100%',
  },
  operatingCashFlow: {
    definition: '经营活动产生的现金流量净额，衡量经营造血能力',
    formula: '经营活动现金流入 - 经营活动现金流出',
  },
  collectionRate: {
    definition: '已回款金额占合同金额的比例，衡量应收账款管理效率',
    formula: '(已回款金额 / 合同总金额) × 100%',
  },
  rdMilestoneRate: {
    definition: '按时完成的研发里程碑数量占总里程碑数量的比例，衡量研发执行力',
    formula: '(按时完成里程碑数 / 计划里程碑总数) × 100%',
  },
  rdIntensity: {
    definition: '研发费用占营业收入的比例，衡量创新投入力度',
    formula: '研发费用 / 营业收入 × 100%',
  },
  grossMarginRate: {
    definition: '毛利占营业收入的比例，衡量产品盈利能力',
    formula: '(营业收入 - 营业成本) / 营业收入 × 100%',
  },
  budgetExecutionRate: {
    definition: '预算执行进度，衡量研发项目预算使用情况',
    formula: '实际支出 / 预算总额 × 100%',
  },
  registrationNodeOnTimeRate: {
    definition: '按时完成注册节点的比例，衡量产品注册进度',
    formula: '按时完成注册节点数 / 计划注册节点数 × 100%',
  },
  totalHeadcount: {
    definition: '员工总数量，衡量人力资源规模',
    formula: '统计期末在职员工总数',
  },
  keyTalentRate: {
    definition: '关键岗位人员占比，衡量人才结构',
    formula: '关键岗位人数 / 员工总人数 × 100%',
  },
  monthlyTurnoverRate: {
    definition: '当月离职人员比例，衡量人员稳定性',
    formula: '离职人数 / 平均在职人数 × 100%',
  },
  revenuePerCapita: {
    definition: '人均创造营业收入，衡量人均效能',
    formula: '营业收入 / 员工人数',
  },
  northStar: {
    definition: '以经营性现金流和回款质量衡量增长质量与经营安全边界',
    formula: '综合评分（分）',
  },
  monthAchieveRate: {
    definition: '当月销售金额占当月目标的比例，衡量月度销售完成情况',
    formula: '(当月销售额 / 当月目标) × 100%',
  },
  ytdAchieveRate: {
    definition: '年度累计销售金额占年度累计目标的比例，衡量年度销售完成情况',
    formula: '(年度累计销售额 / 年度累计目标) × 100%',
  },
  monthSales: {
    definition: '当月实现的销售收入金额',
    formula: '当月实际销售金额',
    isAtomic: true,
  },
  ytdSales: {
    definition: '自年初至当前月份的累计销售收入金额',
    formula: '年度累计销售金额',
    isAtomic: true,
  },
  monthTarget: {
    definition: '当月设定的销售目标金额',
    formula: '当月计划销售金额',
    isAtomic: true,
  },
  ytdTarget: {
    definition: '自年初至当前月份设定的累计销售目标金额',
    formula: '年度累计计划销售金额',
    isAtomic: true,
  },
  revenue: {
    definition: '企业实现的销售收入金额',
    formula: '销售收入',
    isAtomic: true,
  },
  cost: {
    definition: '企业发生的营业成本金额',
    formula: '营业成本',
    isAtomic: true,
  },
  grossProfit: {
    definition: '收入减去成本后的毛利金额',
    formula: '收入 - 成本',
  },
  milestoneOnTimeRate: {
    definition: '按时完成的研发里程碑数量占总里程碑数量的比例，衡量研发执行力',
    formula: '(按时完成里程碑数 / 计划里程碑总数) × 100%',
  },
  activeProjects: {
    definition: '当前正在进行中的研发项目数量',
    formula: '在研项目数量',
    isAtomic: true,
  },
  efficiencyScore: {
    definition: '能效综合评分，综合考量工作效率、质量、协作等多维度指标，满分100分',
    formula: '综合评分 = 工作效率(40%) + 工作质量(30%) + 团队协作(20%) + 创新能力(10%)',
  },
};
