import { Card, Col, Row, Statistic, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';

function colorByRate(value: number, good: number, warn: number) {
  if (value >= good) {
    return '#2e7d32';
  }
  if (value >= warn) {
    return '#c77800';
  }
  return '#cf1322';
}

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

export function ProductionPage() {
  const navigate = useNavigate();
  const hr = dashboardData.hr;

  const trendOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['总人数', '关键人才', '人均产出(万元)'] },
    xAxis: { type: 'category', data: hr.headcountTrend.map((item) => item.month) },
    yAxis: [{ type: 'value', name: '人数' }, { type: 'value', name: '万元/人' }],
    series: [
      {
        name: '总人数',
        type: 'line',
        smooth: true,
        data: hr.headcountTrend.map((item) => item.headcount),
      },
      {
        name: '关键人才',
        type: 'line',
        smooth: true,
        data: hr.headcountTrend.map((item) => item.keyTalent),
      },
      {
        name: '人均产出(万元)',
        type: 'bar',
        yAxisIndex: 1,
        data: hr.headcountTrend.map((item) => item.revenuePerCapita),
        barMaxWidth: 20,
      },
    ],
  };

  const structureOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['在岗人数', '编制目标'] },
    xAxis: {
      type: 'category',
      data: hr.departmentStructure.map((item) => item.department),
      axisLabel: { interval: 0, rotate: 20 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '在岗人数',
        type: 'bar',
        data: hr.departmentStructure.map((item) => item.headcount),
      },
      {
        name: '编制目标',
        type: 'bar',
        data: hr.departmentStructure.map((item) => item.target),
      },
    ],
  };

  const turnoverOption = {
    tooltip: { valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    radar: {
      indicator: hr.departmentStructure.map((item) => ({
        name: item.department,
        max: 20,
      })),
    },
    series: [
      {
        type: 'radar',
        areaStyle: { opacity: 0.22 },
        data: [
          {
            value: hr.departmentStructure.map((item) => item.turnoverRate),
            name: '部门离职率',
          },
        ],
      },
    ],
  };

  const scatterOption = {
    tooltip: {
      formatter: (params: { data: [number, number, number, string] }) => {
        const [headcount, turnover, target, department] = params.data;
        return `${department}<br/>人数: ${fmt2(headcount)}<br/>离职率: ${fmt2(turnover)}%<br/>编制目标: ${fmt2(target)}`;
      },
    },
    xAxis: { type: 'value', name: '在岗人数' },
    yAxis: { type: 'value', name: '离职率(%)', max: 20 },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: [number, number, number, string]) => Math.max(12, data[0] / 12),
        data: hr.departmentStructure.map((item) => [
          item.headcount,
          item.turnoverRate,
          item.target,
          item.department,
        ]),
      },
    ],
  };

  const chartJumpEvents = {
    click: () => navigate('/production#kpi-total-headcount'),
  };

  return (
    <div>
      <h1 className="page-title">人力资源与组织效能专题</h1>
      <Card style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">
          本页优先读取人力数据文件；如字段缺失，自动按组织口径补齐 mock 以保证可演示。
        </Typography.Text>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} lg={6} id="kpi-total-headcount">
          <Card>
            <Statistic title="总在岗人数" value={hr.kpis.totalHeadcount} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="关键人才占比"
              value={hr.kpis.keyTalentRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: colorByRate(hr.kpis.keyTalentRate, 20, 16) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="月离职率"
              value={hr.kpis.monthlyTurnoverRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: hr.kpis.monthlyTurnoverRate > 10 ? '#cf1322' : '#2e7d32' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="人均产出"
              value={hr.kpis.revenuePerCapita}
              precision={2}
              suffix="万元/人"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={15}>
          <Card title="组织规模与人均产出趋势">
            <ReactECharts option={trendOption} style={{ height: 320 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="部门离职率雷达">
            <ReactECharts option={turnoverOption} style={{ height: 320 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="部门编制与在岗对比">
            <ReactECharts option={structureOption} style={{ height: 340 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="人员规模与流失风险分布">
            <ReactECharts option={scatterOption} style={{ height: 340 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
