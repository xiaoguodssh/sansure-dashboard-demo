import { Card, Col, Grid, Row, Segmented, Space, Statistic, Tag, Tooltip, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';
import { useFilterStore } from '../../store/filter/useFilterStore';
import { indicatorDefinitions } from '../../components/IndicatorTooltip';

const { useBreakpoint } = Grid;

function KpiLabel({ label, indicatorKey }: { label: string; indicatorKey: keyof typeof indicatorDefinitions }) {
  const info = indicatorDefinitions[indicatorKey];
  if (!info || info.isAtomic) return label;
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

function toNum(v: number | null | undefined) {
  return v ?? 0;
}

function toRate(v: number | null | undefined) {
  if (v === null || v === undefined) {
    return 0;
  }
  if (v <= 1 && v >= -1) {
    return v * 100;
  }
  return v;
}

function avg(list: number[]) {
  if (!list.length) {
    return 0;
  }
  return list.reduce((sum, item) => sum + item, 0) / list.length;
}

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

function applyCaliber(v: number | null | undefined, caliber: 'combined' | 'management') {
  if (v === null || v === undefined) {
    return null;
  }
  if (caliber === 'management') {
    return Number((v * 1.02).toFixed(2));
  }
  return v;
}

export function SalesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const filter = useFilterStore();
  const update = useFilterStore((s) => s.update);
  const focusCompany = (new URLSearchParams(location.search).get('company') || '').trim();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isLargeScreen = screens.xl;

  useEffect(() => {
    if (!focusCompany) {
      return;
    }
    if (filter.orgLevel !== 'group') {
      update({ orgLevel: 'group' });
    }
  }, [filter.orgLevel, focusCompany, update]);

  const subsidiaries = dashboardData.sales.subsidiaries.map((row) => ({
    ...row,
    monthSales: toNum(applyCaliber(row.monthSales, filter.caliber)),
    monthTarget: toNum(applyCaliber(row.monthTarget, filter.caliber)),
    ytdSales: toNum(applyCaliber(row.ytdSales, filter.caliber)),
    ytdTarget: toNum(applyCaliber(row.ytdTarget, filter.caliber)),
  }));

  const domesticLines = dashboardData.sales.domesticLines.map((row) => ({
    ...row,
    monthSales: toNum(applyCaliber(row.monthSales, filter.caliber)),
    monthTarget: toNum(applyCaliber(row.monthTarget, filter.caliber)),
    ytdSales: toNum(applyCaliber(row.ytdSales, filter.caliber)),
    monthAchieveRate: toRate(row.monthAchieveRate),
    ytdAchieveRate: toRate(row.ytdAchieveRate),
  }));

  const domesticRegions = dashboardData.sales.domesticRegions.map((row) => ({
    ...row,
    monthSales: toNum(applyCaliber(row.monthSales, filter.caliber)),
    monthTarget: toNum(applyCaliber(row.monthTarget, filter.caliber)),
    monthAchieveRate: toRate(row.monthAchieveRate),
    ytdAchieveRate: toRate(row.ytdAchieveRate),
  }));

  const internationalRegions = dashboardData.sales.internationalRegions.map((row) => ({
    ...row,
    monthSales: toNum(applyCaliber(row.monthSales, filter.caliber)),
    monthTarget: toNum(applyCaliber(row.monthTarget, filter.caliber)),
    ytdSales: toNum(applyCaliber(row.ytdSales, filter.caliber)),
    monthAchieveRate: toRate(row.monthAchieveRate),
    ytdAchieveRate: toRate(row.ytdAchieveRate),
  }));

  const canShowDomestic = filter.marketScope === 'all' || filter.marketScope === 'domestic';
  const canShowInternational = filter.marketScope === 'all' || filter.marketScope === 'international';

  const monthSalesDomestic = domesticLines.reduce((sum, item) => sum + item.monthSales, 0);
  const monthTargetDomestic = domesticLines.reduce((sum, item) => sum + item.monthTarget, 0);
  const ytdSalesDomestic = domesticLines.reduce((sum, item) => sum + item.ytdSales, 0);

  const monthSalesInternational = internationalRegions.reduce((sum, item) => sum + item.monthSales, 0);
  const monthTargetInternational = internationalRegions.reduce((sum, item) => sum + item.monthTarget, 0);
  const ytdSalesInternational = internationalRegions.reduce((sum, item) => sum + item.ytdSales, 0);

  const groupCompareRows = [
    {
      name: '国内营销',
      monthSales: monthSalesDomestic,
      monthTarget: monthTargetDomestic,
      ytdSales: ytdSalesDomestic,
    },
    {
      name: '国际营销',
      monthSales: monthSalesInternational,
      monthTarget: monthTargetInternational,
      ytdSales: ytdSalesInternational,
    },
    ...subsidiaries.map((item) => ({
      name: item.company,
      monthSales: item.monthSales,
      monthTarget: item.monthTarget,
      ytdSales: item.ytdSales,
    })),
  ];

  const monthSales =
    filter.orgLevel === 'group'
      ? groupCompareRows.reduce((sum, item) => sum + item.monthSales, 0)
      : canShowDomestic && canShowInternational
        ? monthSalesDomestic + monthSalesInternational
        : canShowDomestic
          ? monthSalesDomestic
          : monthSalesInternational;

  const monthTarget =
    filter.orgLevel === 'group'
      ? groupCompareRows.reduce((sum, item) => sum + item.monthTarget, 0)
      : canShowDomestic && canShowInternational
        ? monthTargetDomestic + monthTargetInternational
        : canShowDomestic
          ? monthTargetDomestic
          : monthTargetInternational;

  const monthAchieve = monthTarget > 0 ? (monthSales / monthTarget) * 100 : 0;

  const latestReceivable = toNum(
    dashboardData.sales.receivableMonthly[dashboardData.sales.receivableMonthly.length - 1]?.amount,
  );
  const grossMarginAvg = avg(
    dashboardData.sales.grossMargins
      .map((item) => toRate(item.actualGrossMargin))
      .filter((item) => Number.isFinite(item)),
  );

  const groupOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['当月销售', '当月目标', '年度累计销售'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 20 },
      data: groupCompareRows.map((item) => item.name),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '当月销售',
        type: 'bar',
        data: groupCompareRows.map((item) =>
          focusCompany && item.name.includes(focusCompany)
            ? { value: item.monthSales, itemStyle: { color: '#1677ff' } }
            : item.monthSales,
        ),
      },
      {
        name: '当月目标',
        type: 'bar',
        data: groupCompareRows.map((item) =>
          focusCompany && item.name.includes(focusCompany)
            ? { value: item.monthTarget, itemStyle: { color: '#73d13d' } }
            : item.monthTarget,
        ),
      },
      {
        name: '年度累计销售',
        type: 'line',
        smooth: true,
        data: groupCompareRows.map((item) =>
          focusCompany && item.name.includes(focusCompany)
            ? { value: item.ytdSales, itemStyle: { color: '#1677ff' } }
            : item.ytdSales,
        ),
      },
    ],
  };

  const lineOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['当月销售', '当月目标', '达成率'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 24 },
      data: domesticLines.map((item) => item.line),
    },
    yAxis: [{ type: 'value' }, { type: 'value', name: '达成率(%)' }],
    series: [
      { name: '当月销售', type: 'bar', data: domesticLines.map((item) => item.monthSales) },
      { name: '当月目标', type: 'bar', data: domesticLines.map((item) => item.monthTarget) },
      {
        name: '达成率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: domesticLines.map((item) => item.monthAchieveRate),
      },
    ],
  };

  const domesticRegionRadarOption = {
    tooltip: { valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    radar: {
      indicator: domesticRegions.slice(0, 8).map((item) => ({
        name: item.region,
        max: 130,
      })),
    },
    series: [
      {
        type: 'radar',
        areaStyle: { opacity: 0.18 },
        data: [
          {
            value: domesticRegions.slice(0, 8).map((item) => item.monthAchieveRate),
            name: '月达成率',
          },
          {
            value: domesticRegions.slice(0, 8).map((item) => item.ytdAchieveRate),
            name: 'YTD达成率',
          },
        ],
      },
    ],
  };

  const internationalOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['当月销售', '当月目标', '达成率'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 24 },
      data: internationalRegions.map((item) => item.region),
    },
    yAxis: [{ type: 'value' }, { type: 'value', name: '达成率(%)' }],
    series: [
      { name: '当月销售', type: 'bar', data: internationalRegions.map((item) => item.monthSales) },
      { name: '当月目标', type: 'bar', data: internationalRegions.map((item) => item.monthTarget) },
      {
        name: '达成率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: internationalRegions.map((item) => item.monthAchieveRate),
      },
    ],
  };

  const regionMap = new Map(dashboardData.sales.regionMappings.map((item) => [item.region, item.regionGroup]));
  const intlGroup = new Map<string, number>();
  for (const row of internationalRegions) {
    const group = regionMap.get(row.region) || row.group || '未分组';
    intlGroup.set(group, (intlGroup.get(group) || 0) + row.monthSales);
  }
  const intlGroupOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker}${params.name}<br/>${fmt2(params.value)} (${fmt2(params.percent)}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        data: [...intlGroup.entries()].map(([name, value]) => ({ name, value })),
      },
    ],
  };

  const receivableOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    xAxis: {
      type: 'category',
      data: dashboardData.sales.receivableMonthly.map((item) => item.month),
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.16 },
        data: dashboardData.sales.receivableMonthly.map((item) => toNum(item.amount)),
      },
    ],
  };

  const marginScatterOption = {
    tooltip: {
      formatter: (params: { data: [number, number, number, string] }) => {
        const [pred, actual, income, name] = params.data;
        return `${name}<br/>预测毛利率: ${fmt2(pred)}%<br/>实际毛利率: ${fmt2(actual)}%<br/>收入: ${fmt2(income)}`;
      },
    },
    xAxis: { type: 'value', name: '预测毛利率(%)' },
    yAxis: { type: 'value', name: '实际毛利率(%)' },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: [number, number, number, string]) => Math.max(10, data[2] / 160),
        data: dashboardData.sales.grossMargins.slice(0, 15).map((item) => [
          toRate(item.predictedGrossMargin),
          toRate(item.actualGrossMargin),
          toNum(item.actualIncome || item.income),
          item.category,
        ]),
      },
    ],
  };

  const chartJumpEvents = {
    click: () => navigate('/sales#kpi-month-achieve'),
  };

  const chartHeight = isMobile ? 280 : isLargeScreen ? 380 : 330;
  const chartHeightSmall = isMobile ? 260 : isLargeScreen ? 350 : 320;

  return (
    <div>
      <h1 className="page-title">销售专题（图表化展示）</h1>
      <Card style={{ marginBottom: 12 }}>
        <Space wrap>
          <Typography.Text>圣湘生物营销板块视角</Typography.Text>
          <Segmented
            value={filter.marketScope}
            options={[
              { label: '全部', value: 'all' },
              { label: '国内', value: 'domestic' },
              { label: '国际', value: 'international' },
            ]}
            onChange={(value) =>
              update({ marketScope: value as 'all' | 'domestic' | 'international' })
            }
          />
          <Tag color="blue">
            {`组织层级: ${filter.orgLevel === 'group' ? '集团' : '子公司'} / 口径: ${
              filter.caliber === 'combined' ? '合并' : '管理'
            }`}
          </Tag>
          {focusCompany ? <Tag color="geekblue">{`当前聚焦: ${focusCompany}`}</Tag> : null}
        </Space>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={<KpiLabel label="当月销售额" indicatorKey="monthSales" />} value={monthSales} precision={2} suffix="万元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={<KpiLabel label="当月目标" indicatorKey="monthTarget" />} value={monthTarget} precision={2} suffix="万元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} id="kpi-month-achieve">
          <Card>
            <Statistic title={<KpiLabel label="当月达成率" indicatorKey="monthAchieveRate" />} value={monthAchieve} precision={2} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={<KpiLabel label="最新回款额" indicatorKey="collectionRate" />} value={latestReceivable} precision={2} suffix="万元" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        {filter.orgLevel === 'group' && (
          <Col span={24}>
            <Card id="chart-group-compare" title="集团层：国内营销/国际营销 + 子公司销售对比">
              <ReactECharts option={groupOption} style={{ height: chartHeight }} onEvents={chartJumpEvents} />
            </Card>
          </Col>
        )}

        {filter.orgLevel === 'subsidiary' && canShowDomestic && (
          <>
            <Col xs={24} lg={16}>
              <Card title="国内：产线销售与达成率">
                <ReactECharts option={lineOption} style={{ height: chartHeight }} onEvents={chartJumpEvents} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="国内：大区/省区达成雷达">
                <ReactECharts
                  option={domesticRegionRadarOption}
                  style={{ height: chartHeight }}
                  onEvents={chartJumpEvents}
                />
              </Card>
            </Col>
          </>
        )}

        {filter.orgLevel === 'subsidiary' && canShowInternational && (
          <>
            <Col xs={24} lg={16}>
              <Card title="国际：区域销售与达成率">
                <ReactECharts option={internationalOption} style={{ height: chartHeight }} onEvents={chartJumpEvents} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="国际：区域分组结构">
                <ReactECharts option={intlGroupOption} style={{ height: chartHeight }} onEvents={chartJumpEvents} />
              </Card>
            </Col>
          </>
        )}

        <Col xs={24} lg={14}>
          <Card title="回款月度趋势">
            <ReactECharts option={receivableOption} style={{ height: chartHeightSmall }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={`毛利偏差散点（均值 ${grossMarginAvg.toFixed(2)}%）`}>
            <ReactECharts option={marginScatterOption} style={{ height: chartHeightSmall }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
