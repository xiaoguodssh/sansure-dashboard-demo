import { Card, Col, Row, Statistic, Tabs, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardData } from '../../services/mock/dashboardData';

type DistItem = { name: string; count: number };

function fmt2(value: number) {
  return Number(value.toFixed(2));
}

function safeDist(data: DistItem[]) {
  return data.length > 0 ? data : [{ name: '暂无数据', count: 0 }];
}

function buildBarOption(data: DistItem[], rotate = 0) {
  const source = safeDist(data);
  return {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate },
      data: source.map((item) => item.name),
    },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: source.map((item) => fmt2(item.count)) }],
  };
}

function buildPieOption(data: DistItem[]) {
  const source = safeDist(data);
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker}${params.name}<br/>${fmt2(params.value)} (${fmt2(params.percent)}%)`,
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        data: source.map((item) => ({ name: item.name, value: fmt2(item.count) })),
      },
    ],
  };
}

const divisionList = [
  { key: 'health', label: '健康消费事业部', data: dashboardData.division },
  { key: 'respiratory', label: '呼吸道事业部', data: null },
  { key: 'life', label: '生命科学事业部（demo）', data: null },
  { key: 'international', label: '国际事业部（demo）', data: null },
];

function DivisionContent({ division }: { division: typeof dashboardData.division }) {
  const navigate = useNavigate();
  const chartJumpEvents = {
    click: () => navigate('/line#kpi-sample-count'),
  };

  const sheetVolumeOption = {
    tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${fmt2(Number(value))}` },
    legend: { data: ['总行数', '导出行数'] },
    xAxis: {
      type: 'category',
      axisLabel: { interval: 0, rotate: 18 },
      data: division.sheetVolumes.slice(0, 12).map((item) => item.sheet),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总行数',
        type: 'bar',
        data: division.sheetVolumes.slice(0, 12).map((item) => item.totalRows),
      },
      {
        name: '导出行数',
        type: 'bar',
        data: division.sheetVolumes.slice(0, 12).map((item) => item.exportRows),
      },
    ],
  };

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} lg={6} id="kpi-sample-count">
        <Card>
          <Statistic title="样本总量" value={division.overview.sampleCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="实验总量" value={division.overview.experimentCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="实验分析结果总量" value={division.overview.experimentAnalysisCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="质控结果总量" value={division.overview.qcResultCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="实验报告总量" value={division.overview.reportCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="患者总量" value={division.overview.patientCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="病原体条目数" value={division.overview.pathogenCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic title="京东业务样本量" value={division.overview.jdSampleCount} />
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="各 Sheet 数据体量（总行数/导出行数）">
          <ReactECharts option={sheetVolumeOption} style={{ height: 340 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="样本类型分布">
          <ReactECharts
            option={buildPieOption(division.sampleTypeDist)}
            style={{ height: 300 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="检测结果分布">
          <ReactECharts
            option={buildPieOption(division.detectionResultDist)}
            style={{ height: 300 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="实验类型分布">
          <ReactECharts
            option={buildBarOption(division.experimentTypeDist, 22)}
            style={{ height: 310 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="实验状态分布">
          <ReactECharts
            option={buildBarOption(division.experimentStatusDist, 16)}
            style={{ height: 310 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="质控结果分布">
          <ReactECharts option={buildPieOption(division.qcResultDist)} style={{ height: 300 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="质控指标类型分布">
          <ReactECharts option={buildBarOption(division.qcValueTypeDist)} style={{ height: 300 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="报告类型分布">
          <ReactECharts option={buildBarOption(division.reportTypeDist)} style={{ height: 300 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="报告状态分布">
          <ReactECharts option={buildBarOption(division.reportStatusDist)} style={{ height: 300 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="患者性别分布">
          <ReactECharts option={buildPieOption(division.patientSexDist)} style={{ height: 290 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="患者年龄分层">
          <ReactECharts option={buildBarOption(division.patientAgeDist)} style={{ height: 290 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="患者区域 Top">
          <ReactECharts
            option={buildBarOption(division.patientRegionDist, 28)}
            style={{ height: 290 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="病原体分类分布">
          <ReactECharts option={buildBarOption(division.pathogenClassDist, 18)} style={{ height: 280 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="病原体风险分布">
          <ReactECharts option={buildPieOption(division.pathogenRiskDist)} style={{ height: 280 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="疾控点位类型分布">
          <ReactECharts option={buildBarOption(division.cdcPointTypeDist)} style={{ height: 280 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card title="疾控点区域分布 Top">
          <ReactECharts option={buildBarOption(division.cdcRegionDist, 28)} style={{ height: 300 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="京东业务：检测类型分布">
          <ReactECharts
            option={buildBarOption(division.jdDetectionTypeDist, 24)}
            style={{ height: 300 }}
            onEvents={chartJumpEvents}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="京东业务：样本类型分布">
          <ReactECharts option={buildBarOption(division.jdSampleTypeDist)} style={{ height: 280 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="京东业务：报告状态分布">
          <ReactECharts option={buildPieOption(division.jdReportStatusDist)} style={{ height: 280 }} onEvents={chartJumpEvents} />
        </Card>
      </Col>
    </Row>
  );
}

function PlaceholderContent({ label }: { label: string }) {
  return (
    <Card>
      <Typography.Text type="secondary">
        {label} 数据待接入，当前暂无数据展示。
      </Typography.Text>
      <Typography.Paragraph style={{ marginTop: 16 }}>
        <Typography.Text>该事业部指标配置将后续添加。</Typography.Text>
      </Typography.Paragraph>
    </Card>
  );
}

export function LinePage() {
  const [activeDivision, setActiveDivision] = useState('health');

  const items = divisionList.map((div) => ({
    key: div.key,
    label: div.label,
    children: div.data ? (
      <DivisionContent division={div.data} />
    ) : (
      <PlaceholderContent label={div.label} />
    ),
  }));

  return (
    <div>
      <h1 className="page-title">事业部业务运营专题</h1>
      <Card style={{ marginBottom: 12 }}>
        <Tabs
          activeKey={activeDivision}
          onChange={setActiveDivision}
          items={items}
        />
      </Card>
    </div>
  );
}
