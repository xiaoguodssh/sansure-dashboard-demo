import { Card, Col, Row, Statistic, Table, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';

function toWan(value: number) {
  return value / 10000;
}

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

export function FinancePage() {
  const navigate = useNavigate();
  const finance = dashboardData.finance;
  const monthly = finance.monthly;
  const recent = monthly.slice(-12);

  const trendOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['收入', '成本', '毛利'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 26 },
      data: recent.map((item) => item.month),
    },
    yAxis: { type: 'value', name: '万元' },
    series: [
      { name: '收入', type: 'bar', data: recent.map((item) => toWan(item.revenue)) },
      { name: '成本', type: 'bar', data: recent.map((item) => toWan(item.cost)) },
      { name: '毛利', type: 'line', smooth: true, data: recent.map((item) => toWan(item.grossProfit)) },
    ],
  };

  const rateOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['毛利率', '回款达成率'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 26 },
      data: recent.map((item) => item.month),
    },
    yAxis: { type: 'value', name: '%' },
    series: [
      { name: '毛利率', type: 'line', smooth: true, data: recent.map((item) => item.grossMarginRate) },
      { name: '回款达成率', type: 'line', smooth: true, data: recent.map((item) => item.collectionRate) },
    ],
  };

  const cashOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    xAxis: {
      type: 'category',
      data: recent.map((item) => item.month),
    },
    yAxis: { type: 'value', name: '百万元' },
    series: [
      {
        name: '经营性现金流',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.18 },
        data: recent.map((item) => item.operatingCashFlow),
      },
    ],
  };

  const chartEvents = {
    click: (params: { seriesName?: string }) => {
      if (params.seriesName === '经营性现金流') {
        navigate('/finance#kpi-operating-cashflow');
        return;
      }
      if (params.seriesName === '回款达成率') {
        navigate('/finance#kpi-collection-rate');
        return;
      }
      if (params.seriesName === '毛利率') {
        navigate('/finance#kpi-gross-margin-rate');
        return;
      }
      navigate('/finance#kpi-profit-rate');
    },
  };

  return (
    <div>
      <h1 className="page-title">财务专题</h1>
      <Card style={{ marginBottom: 12 }}>
        当前财务数据已接入毛利与回款文件，且与总览页利润达成率、经营性现金流、回款达成率口径一致。
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="收入" value={toWan(finance.kpis.revenue)} precision={2} suffix="万元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="成本" value={toWan(finance.kpis.cost)} precision={2} suffix="万元" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="毛利"
              value={toWan(finance.kpis.grossProfit)}
              precision={2}
              suffix="万元"
              valueStyle={{ color: finance.kpis.grossProfit >= 0 ? '#2e7d32' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} id="kpi-operating-cashflow">
          <Card>
            <Statistic title="经营性现金流" value={finance.kpis.operatingCashFlow} precision={2} suffix="百万元" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} lg={8} id="kpi-gross-margin-rate">
          <Card>
            <Statistic title="毛利率" value={finance.kpis.grossMarginRate} precision={2} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} id="kpi-profit-rate">
          <Card>
            <Statistic title="利润达成率" value={finance.kpis.profitRate} precision={2} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8} id="kpi-collection-rate">
          <Card>
            <Statistic title="回款达成率" value={finance.kpis.collectionRate} precision={2} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card title="近12个月收入/成本/毛利">
            <ReactECharts option={trendOption} style={{ height: 330 }} onEvents={chartEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="近12个月经营性现金流">
            <ReactECharts option={cashOption} style={{ height: 330 }} onEvents={chartEvents} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="近12个月财务明细">
            <Table
              rowKey={(row) => row.month}
              dataSource={recent}
              pagination={false}
              columns={[
                { title: '月份', dataIndex: 'month' },
                {
                  title: '收入(万元)',
                  dataIndex: 'revenue',
                  render: (value: number) => toWan(value).toFixed(2),
                },
                {
                  title: '成本(万元)',
                  dataIndex: 'cost',
                  render: (value: number) => toWan(value).toFixed(2),
                },
                {
                  title: '毛利(万元)',
                  dataIndex: 'grossProfit',
                  render: (value: number) => (
                    <Tag color={value >= 0 ? 'green' : 'red'}>{toWan(value).toFixed(2)}</Tag>
                  ),
                },
                {
                  title: '毛利率(%)',
                  dataIndex: 'grossMarginRate',
                },
                {
                  title: '回款达成率(%)',
                  dataIndex: 'collectionRate',
                },
                {
                  title: '经营性现金流(百万元)',
                  dataIndex: 'operatingCashFlow',
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="近12个月毛利率与回款达成率">
            <ReactECharts option={rateOption} style={{ height: 300 }} onEvents={chartEvents} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
