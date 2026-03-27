import { Card, Progress, Space, Tag, Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';
import { useFilterStore } from '../../store/filter/useFilterStore';
import { indicatorDefinitions } from '../../components/IndicatorTooltip';

function KpiLabel({ label, indicatorKey }: { label: string; indicatorKey: keyof typeof indicatorDefinitions }) {
  const info = indicatorDefinitions[indicatorKey];
  if (!info) return label;
  return (
    <span>
      {label}
      <Tooltip
        title={
          <div>
            <div style={{ marginBottom: 8 }}><strong>定义：</strong>{info.definition}</div>
            <div><strong>计算公式：</strong><code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>{info.formula}</code></div>
          </div>
        }
      >
        <QuestionCircleOutlined style={{ marginLeft: 4, cursor: 'help', color: '#999' }} />
      </Tooltip>
    </span>
  );
}

function normalizeToMonth(date: string) {
  return date.slice(0, 7);
}

function applyCaliber(value: number, caliber: 'combined' | 'management') {
  if (caliber === 'management') {
    return Number((value * 1.03).toFixed(2));
  }
  return value;
}

function getScopeFactor(scope: 'all' | 'domestic' | 'international') {
  if (scope === 'domestic') return 0.86;
  if (scope === 'international') return 0.14;
  return 1;
}

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

export function OverviewPage() {
  const navigate = useNavigate();
  const filter = useFilterStore();
  const start = normalizeToMonth(filter.dateRange[0]);
  const end = normalizeToMonth(filter.dateRange[1]);
  const scopeFactor = getScopeFactor(filter.marketScope);

  const trend = dashboardData.overview.trend
    .filter((item) => item.month >= start && item.month <= end)
    .map((item) => ({
      ...item,
      revenueRate: fmt2(item.revenueRate * scopeFactor),
      profitRate: fmt2(item.profitRate * scopeFactor),
    }));

  const kpiSource = dashboardData.overview.kpis;
  const strategy = dashboardData.overview.strategy;
  const kpis = {
    revenueRate: applyCaliber(fmt2(kpiSource.revenueRate * scopeFactor), filter.caliber),
    profitRate: applyCaliber(fmt2(kpiSource.profitRate * scopeFactor), filter.caliber),
    operatingCashFlow: applyCaliber(
      fmt2(kpiSource.operatingCashFlow * scopeFactor),
      filter.caliber,
    ),
    collectionRate: applyCaliber(kpiSource.collectionRate, filter.caliber),
    rdMilestoneRate: applyCaliber(kpiSource.rdMilestoneRate, filter.caliber),
  };

  const contributionBase = dashboardData.overview.contribution;
  const contribution =
    filter.orgLevel === 'group'
      ? contributionBase.filter(
          (item) =>
            !(
              item.name.includes('合计') &&
              (item.name.includes('海济') || item.name.includes('红岸'))
            ),
        )
      : contributionBase.filter((item) =>
          ['安赛', '海济', '红岸', '圣维尔'].some((k) => item.name.includes(k)),
        );

  const anomalies = dashboardData.overview.anomalies.filter((item) => {
    if (filter.marketScope === 'domestic') {
      return !['中东非洲', '泰越', '西欧', '独联体', '拉美', '法国分公司'].some((k) =>
        item.org.includes(k),
      );
    }
    if (filter.marketScope === 'international') {
      return ['中东非洲', '泰越', '西欧', '独联体', '拉美', '法国分公司'].some((k) =>
        item.org.includes(k),
      );
    }
    return true;
  });

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `${fmt2(Number(value))}`,
    },
    legend: { data: ['营收达成率', '利润达成率'] },
    xAxis: {
      type: 'category',
      data: trend.map((item) => item.month),
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: trend.map((item) => item.revenueRate),
        type: 'line',
        smooth: true,
        name: '营收达成率',
      },
      {
        data: trend.map((item) => item.profitRate),
        type: 'line',
        smooth: true,
        name: '利润达成率',
      },
    ],
  };

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker}${params.name}<br/>${fmt2(params.value)} (${fmt2(params.percent)}%)`,
    },
    series: [
      {
        name: '结构贡献',
        type: 'pie',
        radius: '70%',
        data: contribution.map((item) => ({
          value: item.value,
          name: item.name,
        })),
      },
    ],
  };

  const trendEvents = {
    click: (params: { seriesName?: string }) => {
      if (params.seriesName === '营收达成率') {
        navigate('/sales#kpi-month-achieve');
        return;
      }
      if (params.seriesName === '利润达成率') {
        navigate('/finance#kpi-profit-rate');
        return;
      }
      navigate('/overview');
    },
  };

  const pieEvents = {
    click: (params: { name?: string }) => {
      const company = params.name || '';
      if (!company) {
        navigate('/sales#chart-group-compare');
        return;
      }
      navigate(`/sales?company=${encodeURIComponent(company)}#chart-group-compare`);
    },
  };

  const northStarProgress = Math.max(
    0,
    Math.min(100, fmt2((strategy.northStar.current / strategy.northStar.target) * 100)),
  );

  return (
    <div>
      <h1 className="page-title">集团总览</h1>
      <Card style={{ marginBottom: 12 }}>
        当前筛选：组织层级 {filter.orgLevel === 'group' ? '集团' : '子公司'} / 市场{' '}
        {filter.marketScope === 'all'
          ? '全部'
          : filter.marketScope === 'domestic'
            ? '国内'
            : '国际'}{' '}
        / 口径 {filter.caliber === 'combined' ? '合并' : '管理'}
      </Card>

      <Card title="1+4+N 指标结构（战略解码）" style={{ marginBottom: 12 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card
            hoverable
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/finance#kpi-operating-cashflow')}
          >
            <Typography.Text type="secondary">
              <KpiLabel label={strategy.northStar.name} indicatorKey="northStar" />
            </Typography.Text>
            <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 4 }}>
              {fmt2(strategy.northStar.current)} / {fmt2(strategy.northStar.target)} {strategy.northStar.unit}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 8 }}>
              {strategy.northStar.description}
            </Typography.Paragraph>
            <Progress percent={northStarProgress} status={northStarProgress >= 100 ? 'success' : 'active'} />
          </Card>

          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            {strategy.dimensions.map((dimension) => (
              <Card
                key={dimension.key}
                hoverable
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(dimension.kpis[0]?.route || '/overview')}
              >
                <Typography.Text type="secondary">{`${dimension.name}（权重 ${dimension.weight}%）`}</Typography.Text>
                <Typography.Title level={4} style={{ marginTop: 8, marginBottom: 8 }}>
                  {dimension.objective}
                </Typography.Title>
                <Space wrap size={[8, 8]}>
                  {dimension.kpis.map((item) => (
                    <Tag
                      key={item.name}
                      color={item.current >= item.target ? 'green' : item.current >= item.target * 0.92 ? 'gold' : 'red'}
                    >
                      {`${item.name}: ${fmt2(item.current)}${item.unit}`}
                    </Tag>
                  ))}
                </Space>
              </Card>
            ))}
          </div>
        </Space>
      </Card>

      <div className="kpi-grid">
        <Card
          hoverable
          onClick={() => navigate('/sales#kpi-month-achieve')}
          style={{ cursor: 'pointer' }}
        >
          <Typography.Text type="secondary"><KpiLabel label="营收达成率" indicatorKey="revenueRate" /></Typography.Text>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {kpis.revenueRate}%
          </Typography.Title>
        </Card>
        <Card
          hoverable
          onClick={() => navigate('/finance#kpi-profit-rate')}
          style={{ cursor: 'pointer' }}
        >
          <Typography.Text type="secondary"><KpiLabel label="利润达成率" indicatorKey="profitRate" /></Typography.Text>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {kpis.profitRate}%
          </Typography.Title>
        </Card>
        <Card
          hoverable
          onClick={() => navigate('/finance#kpi-operating-cashflow')}
          style={{ cursor: 'pointer' }}
        >
          <Typography.Text type="secondary"><KpiLabel label="经营性现金流（百万元）" indicatorKey="operatingCashFlow" /></Typography.Text>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {kpis.operatingCashFlow}
          </Typography.Title>
        </Card>
        <Card
          hoverable
          onClick={() => navigate('/finance#kpi-collection-rate')}
          style={{ cursor: 'pointer' }}
        >
          <Typography.Text type="secondary"><KpiLabel label="回款达成率" indicatorKey="collectionRate" /></Typography.Text>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {kpis.collectionRate}%
          </Typography.Title>
        </Card>
        <Card
          hoverable
          onClick={() => navigate('/rd#kpi-milestone-rate')}
          style={{ cursor: 'pointer' }}
        >
          <Typography.Text type="secondary"><KpiLabel label="研发里程碑达成率" indicatorKey="rdMilestoneRate" /></Typography.Text>
          <Typography.Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
            {kpis.rdMilestoneRate}%
          </Typography.Title>
        </Card>
      </div>

      <div className="chart-grid">
        <Card title="经营趋势">
          <ReactECharts option={trendOption} style={{ height: 320 }} onEvents={trendEvents} />
        </Card>
        <Card title="结构贡献">
          <ReactECharts option={pieOption} style={{ height: 320 }} onEvents={pieEvents} />
        </Card>
      </div>

      <Card title={`异常榜单（${anomalies.length} 条）`} style={{ marginTop: 12 }}>
        {anomalies.slice(0, 10).map((item) => (
          <Typography.Paragraph key={`${item.org}-${item.metric}`} style={{ marginBottom: 8 }}>
            [{item.level}] {item.org} - {item.metric}: {item.value}%（阈值 {item.threshold}）
          </Typography.Paragraph>
        ))}
      </Card>
    </div>
  );
}
