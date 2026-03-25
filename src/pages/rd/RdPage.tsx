import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';

function kpiTone(value: number, threshold: number) {
  if (value >= threshold) {
    return '#2e7d32';
  }
  if (value >= threshold - 8) {
    return '#c77800';
  }
  return '#cf1322';
}

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

export function RdPage() {
  const navigate = useNavigate();
  const rd = dashboardData.rd;

  const milestoneOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['计划节点', '完成节点', '达成率'] },
    xAxis: { type: 'category', data: rd.milestoneTrend.map((item) => item.month) },
    yAxis: [{ type: 'value', name: '节点数' }, { type: 'value', name: '达成率(%)' }],
    series: [
      {
        name: '计划节点',
        type: 'bar',
        data: rd.milestoneTrend.map((item) => item.planned),
        barMaxWidth: 18,
      },
      {
        name: '完成节点',
        type: 'bar',
        data: rd.milestoneTrend.map((item) => item.completed),
        barMaxWidth: 18,
      },
      {
        name: '达成率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rd.milestoneTrend.map((item) => item.completionRate),
      },
    ],
  };

  const stageOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker}${params.name}<br/>${fmt2(params.value)} (${fmt2(params.percent)}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        data: rd.stageDistribution.map((item) => ({
          name: item.stage,
          value: item.count,
        })),
        label: {
          formatter: '{b}: {c}',
        },
      },
    ],
  };

  const budgetOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['预算(万元)', '实际(万元)', '进度(%)'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 28 },
      data: rd.projects.map((item) => item.project),
    },
    yAxis: [{ type: 'value' }, { type: 'value', name: '进度(%)' }],
    series: [
      {
        name: '预算(万元)',
        type: 'bar',
        data: rd.projects.map((item) => item.budget),
      },
      {
        name: '实际(万元)',
        type: 'bar',
        data: rd.projects.map((item) => item.actual),
      },
      {
        name: '进度(%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: rd.projects.map((item) => item.progress),
      },
    ],
  };

  const riskOption = {
    tooltip: {
      formatter: (params: { data: [number, number, number, string, number] }) => {
        const [, progress, budget, project, risk] = params.data;
        return `${project}<br/>进度: ${fmt2(progress)}%<br/>预算: ${fmt2(budget)} 万元<br/>风险: ${fmt2(risk)}`;
      },
    },
    xAxis: { type: 'value', name: '项目序位' },
    yAxis: { type: 'value', name: '进度(%)', max: 110 },
    series: [
      {
        type: 'scatter',
        symbolSize: (data: [number, number, number, string, number]) => Math.max(12, data[4] / 2.4),
        data: rd.projects.map((item, idx) => [
          idx + 1,
          item.progress,
          item.budget,
          item.project,
          item.risk,
        ]),
      },
    ],
  };

  const chartJumpEvents = {
    click: () => navigate('/rd#kpi-milestone-rate'),
  };

  return (
    <div>
      <h1 className="page-title">研发项目专题</h1>
      <Card style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary">
          研发项目数据已接入。若源文件缺失，系统会按项目结构自动补齐 mock 数据，保证演示连续性。
        </Typography.Text>
      </Card>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="在研项目数" value={rd.kpis.activeProjects} suffix="个" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6} id="kpi-milestone-rate">
          <Card>
            <Statistic
              title="里程碑按期达成率"
              value={rd.kpis.milestoneOnTimeRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: kpiTone(rd.kpis.milestoneOnTimeRate, 100) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="预算执行率"
              value={rd.kpis.budgetExecutionRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: kpiTone(rd.kpis.budgetExecutionRate, 95) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="注册节点按期率"
              value={rd.kpis.registrationNodeOnTimeRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: kpiTone(rd.kpis.registrationNodeOnTimeRate, 95) }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card title="研发里程碑执行趋势">
            <ReactECharts option={milestoneOption} style={{ height: 330 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="项目阶段分布">
            <ReactECharts option={stageOption} style={{ height: 330 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="项目预算执行与进度">
            <ReactECharts option={budgetOption} style={{ height: 360 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <span>
                项目风险气泡
                <Tag style={{ marginLeft: 8 }}>风险越高气泡越大</Tag>
              </span>
            }
          >
            <ReactECharts option={riskOption} style={{ height: 360 }} onEvents={chartJumpEvents} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
