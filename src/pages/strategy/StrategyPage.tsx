import {
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { TextArea } = Input;
const { Step } = Steps;
const { Panel } = Collapse;

interface StrategyInput {
  objective: string;
  period: 'annual' | 'three_year';
  budgetConstraint?: number;
  cashSafetyLine?: number;
  rdIntensity?: number;
}

interface Dimension {
  key: string;
  name: string;
  weight: number;
  objective: string;
  kpis: KPI[];
}

interface KPI {
  id: string;
  name: string;
  formula: string;
  unit: string;
  current: number;
  target: number;
  thresholdRed: number;
  thresholdYellow: number;
  department: string;
  route: string;
}

interface NorthStar {
  name: string;
  description: string;
  current: number;
  target: number;
  unit: string;
}

interface StrategyResult {
  id: string;
  timestamp: string;
  input: StrategyInput;
  northStar: NorthStar;
  dimensions: Dimension[];
  targetPlan: {
    annual: { conservative: number; baseline: number; aggressive: number };
    quarterly: number[];
    monthly: number[];
  };
  thresholds: Record<string, { red: number; yellow: number; green: number }>;
  actionTemplates: string[];
}

const dimensionTemplates = [
  {
    key: 'growth',
    name: '增长',
    weight: 30,
    objective: '实现高质量增长',
    kpis: [
      { name: '营收达成率', formula: '实际营收 / 目标营收 × 100%', unit: '%', department: '销售', route: '/sales#kpi-month-achieve' },
      { name: '增长趋势', formula: '本期营收 / 上期营收 × 100% - 100%', unit: '%', department: '销售', route: '/sales' },
      { name: '结构贡献', formula: '各业务线营收占比', unit: '%', department: '销售', route: '/sales#chart-group-compare' },
    ],
  },
  {
    key: 'profit',
    name: '盈利',
    weight: 25,
    objective: '提升盈利能力',
    kpis: [
      { name: '利润达成率', formula: '实际利润 / 目标利润 × 100%', unit: '%', department: '财务', route: '/finance#kpi-profit-rate' },
      { name: '毛利率', formula: '毛利 / 营收 × 100%', unit: '%', department: '财务', route: '/finance' },
      { name: '毛利偏差', formula: '实际毛利 - 目标毛利', unit: '百万元', department: '财务', route: '/finance' },
    ],
  },
  {
    key: 'cash',
    name: '现金',
    weight: 25,
    objective: '保障经营安全',
    kpis: [
      { name: '经营性现金流', formula: '经营活动现金净额', unit: '百万元', department: '财务', route: '/finance#kpi-operating-cashflow' },
      { name: '回款达成率', formula: '实际回款 / 目标回款 × 100%', unit: '%', department: '销售', route: '/sales#kpi-collection-rate' },
      { name: '周转效率', formula: '365 / (营收 / 平均营运资本)', unit: '次', department: '财务', route: '/finance' },
    ],
  },
  {
    key: 'capability',
    name: '能力',
    weight: 20,
    objective: '夯实组织能力',
    kpis: [
      { name: '研发里程碑达成率', formula: '按期完成里程碑 / 总里程碑 × 100%', unit: '%', department: '研发', route: '/rd#kpi-milestone-rate' },
      { name: '关键人才占比', formula: '关键人才数 / 总人数 × 100%', unit: '%', department: '人力', route: '/production' },
      { name: '离职率', formula: '离职人数 / 平均人数 × 100%', unit: '%', department: '人力', route: '/production' },
    ],
  },
];

const northStarTemplate = {
  name: '经营性现金创造能力',
  description: '反映增长质量与经营安全边界',
  unit: '百万元',
};

const actionTemplates = [
  '召开经营分析会，识别偏差根因',
  '调整销售策略与资源配置',
  '优化成本结构与费用管控',
  '加强回款催收与信用管理',
  '启动专项改进项目',
];

export function StrategyPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [history, setHistory] = useState<StrategyResult[]>([]);
  const [previewResult, setPreviewResult] = useState<StrategyResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form] = Form.useForm<StrategyInput>();

  const generateResult = (values: StrategyInput): StrategyResult => {
    const targetBase = values.budgetConstraint || 10000;
    const currentBase = targetBase * (0.85 + Math.random() * 0.2);

    const northStar: NorthStar = {
      ...northStarTemplate,
      current: Number((currentBase * 0.3).toFixed(2)),
      target: Number((targetBase * 0.35).toFixed(2)),
    };

    const dimensions = dimensionTemplates.map((dim) => ({
      ...dim,
      kpis: dim.kpis.map((kpi, idx) => ({
        ...kpi,
        id: `${dim.key}-${idx}`,
        current: Number((currentBase * (0.8 + Math.random() * 0.4)).toFixed(2)),
        target: Number((targetBase * (0.9 + Math.random() * 0.2)).toFixed(2)),
        thresholdRed: 90,
        thresholdYellow: 100,
      })),
    }));

    const targetPlan = {
      annual: {
        conservative: Number((targetBase * 0.9).toFixed(2)),
        baseline: Number(targetBase.toFixed(2)),
        aggressive: Number((targetBase * 1.1).toFixed(2)),
      },
      quarterly: Array.from({ length: 4 }, () => Number((targetBase * 0.25 * (0.9 + Math.random() * 0.2)).toFixed(2))),
      monthly: Array.from({ length: 12 }, () => Number((targetBase * 0.083 * (0.9 + Math.random() * 0.2)).toFixed(2))),
    };

    const thresholds: Record<string, { red: number; yellow: number; green: number }> = {};
    dimensions.forEach((dim) => {
      dim.kpis.forEach((kpi) => {
        thresholds[kpi.id] = {
          red: kpi.thresholdRed,
          yellow: kpi.thresholdYellow,
          green: 100,
        };
      });
    });

    return {
      id: `strategy-${Date.now()}`,
      timestamp: new Date().toISOString(),
      input: values,
      northStar,
      dimensions,
      targetPlan,
      thresholds,
      actionTemplates,
    };
  };

  const handleGenerate = () => {
    form.validateFields().then((values) => {
      const result = generateResult(values);
      setPreviewResult(result);
      setCurrentStep(1);
    });
  };

  const handleSave = () => {
    if (previewResult) {
      setHistory([previewResult, ...history]);
      message.success('拆解结果已保存到历史记录');
      setCurrentStep(2);
    }
  };

  const handleApply = () => {
    message.success('指标体系已应用到系统中');
    setShowApplyModal(false);
    setCurrentStep(3);
  };

  const handleViewHistory = (record: StrategyResult) => {
    setPreviewResult(record);
    setShowHistory(false);
    setCurrentStep(1);
  };

  const kpiColumns = [
    { title: '指标名称', dataIndex: 'name', key: 'name' },
    { title: '公式', dataIndex: 'formula', key: 'formula' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '当前值', dataIndex: 'current', key: 'current', width: 100 },
    { title: '目标值', dataIndex: 'target', key: 'target', width: 100 },
    { title: '责任部门', dataIndex: 'department', key: 'department', width: 120 },
  ];

  return (
    <div>
      <Typography.Title level={2}>方法论框架 - 战略目标智能拆解器</Typography.Title>
      <Card style={{ marginBottom: 16 }}>
        <Steps current={currentStep}>
          <Step title="输入战略目标" />
          <Step title="预览拆解结果" />
          <Step title="保存历史" />
          <Step title="应用到系统" />
        </Steps>
      </Card>

      {currentStep === 0 && (
        <Card title="第一步：输入战略目标与约束条件">
          <Form form={form} layout="vertical">
            <Form.Item
              label="战略目标"
              name="objective"
              rules={[{ required: true, message: '请输入战略目标' }]}
            >
              <TextArea rows={4} placeholder="例如：实现高质量增长，提升盈利能力，保障经营安全" />
            </Form.Item>
            <Form.Item
              label="规划周期"
              name="period"
              initialValue="annual"
              rules={[{ required: true, message: '请选择规划周期' }]}
            >
              <Select>
                <Select.Option value="annual">年度规划</Select.Option>
                <Select.Option value="three_year">三年规划</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="预算约束（百万元）" name="budgetConstraint">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item label="现金安全线（百万元）" name="cashSafetyLine">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item
              label={
                <Tooltip title="研发投入强度 = 研发费用 / 营业收入 × 100%。生物医药行业参考标准为10%-20%，高新技术企业需≥4%">
                  <span>研发投入强度（%）<QuestionCircleOutlined style={{ marginLeft: 4 }} /></span>
                </Tooltip>
              }
              name="rdIntensity"
            >
              <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" onClick={handleGenerate}>
                  开始拆解
                </Button>
                <Button onClick={() => setShowHistory(true)}>
                  查看历史
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {currentStep === 1 && previewResult && (
        <Card
          title="第二步：预览拆解结果"
          extra={
            <Space>
              <Button onClick={() => setCurrentStep(0)}>返回修改</Button>
              <Button type="primary" onClick={handleSave}>
                保存到历史
              </Button>
            </Space>
          }
        >
          <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="战略目标">{previewResult.input.objective}</Descriptions.Item>
            <Descriptions.Item label="规划周期">
              {previewResult.input.period === 'annual' ? '年度规划' : '三年规划'}
            </Descriptions.Item>
            <Descriptions.Item label="预算约束">
              {previewResult.input.budgetConstraint || '-'} 百万元
            </Descriptions.Item>
            <Descriptions.Item label="生成时间">
              {new Date(previewResult.timestamp).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>

          <Card type="inner" title="北极星指标" style={{ marginBottom: 16 }}>
            <Descriptions bordered>
              <Descriptions.Item label="指标名称">{previewResult.northStar.name}</Descriptions.Item>
              <Descriptions.Item label="描述">{previewResult.northStar.description}</Descriptions.Item>
              <Descriptions.Item label="当前值">
                {previewResult.northStar.current} {previewResult.northStar.unit}
              </Descriptions.Item>
              <Descriptions.Item label="目标值">
                {previewResult.northStar.target} {previewResult.northStar.unit}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Collapse defaultActiveKey={['growth', 'profit', 'cash', 'capability']} style={{ marginBottom: 16 }}>
            {previewResult.dimensions.map((dim) => (
              <Panel header={`${dim.name}（权重 ${dim.weight}%）`} key={dim.key}>
                <Descriptions bordered column={1} style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="目标">{dim.objective}</Descriptions.Item>
                </Descriptions>
                <Table
                  columns={kpiColumns}
                  dataSource={dim.kpis}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Panel>
            ))}
          </Collapse>

          <Card type="inner" title="目标值规划" style={{ marginBottom: 16 }}>
            <Collapse>
              <Panel header="年度目标（保守/基准/进取）" key="annual">
                <Space size="large">
                  <Tag color="red">保守：{previewResult.targetPlan.annual.conservative} 百万元</Tag>
                  <Tag color="blue">基准：{previewResult.targetPlan.annual.baseline} 百万元</Tag>
                  <Tag color="green">进取：{previewResult.targetPlan.annual.aggressive} 百万元</Tag>
                </Space>
              </Panel>
              <Panel header="季度目标" key="quarterly">
                <Space wrap>
                  {previewResult.targetPlan.quarterly.map((val, idx) => (
                    <Tag key={idx}>Q{idx + 1}: {val} 百万元</Tag>
                  ))}
                </Space>
              </Panel>
              <Panel header="月度目标" key="monthly">
                <Space wrap>
                  {previewResult.targetPlan.monthly.map((val, idx) => (
                    <Tag key={idx}>{idx + 1}月: {val} 百万元</Tag>
                  ))}
                </Space>
              </Panel>
            </Collapse>
          </Card>

          <Card type="inner" title="预警阈值">
            <Table
              columns={[
                { title: '指标ID', dataIndex: 'key', key: 'key' },
                { title: '红色阈值', dataIndex: ['thresholds', 'red'], key: 'red' },
                { title: '黄色阈值', dataIndex: ['thresholds', 'yellow'], key: 'yellow' },
                { title: '绿色阈值', dataIndex: ['thresholds', 'green'], key: 'green' },
              ]}
              dataSource={Object.entries(previewResult.thresholds).map(([key, val]) => ({ key, thresholds: val }))}
              rowKey="key"
              pagination={false}
              size="small"
            />
          </Card>
        </Card>
      )}

      {currentStep === 2 && (
        <Card
          title="第三步：保存历史"
          extra={
            <Space>
              <Button onClick={() => setCurrentStep(1)}>返回预览</Button>
              <Button type="primary" onClick={() => setShowApplyModal(true)}>
                应用到系统
              </Button>
            </Space>
          }
        >
          <Typography.Paragraph>
            拆解结果已保存到历史记录。历史记录不会删除，您可以随时查看和复用。
          </Typography.Paragraph>
          <Button onClick={() => setShowHistory(true)}>查看所有历史记录</Button>
        </Card>
      )}

      {currentStep === 3 && (
        <Card
          title="第四步：应用到系统"
          extra={
            <Button onClick={() => setCurrentStep(0)}>
              开始新的拆解
            </Button>
          }
        >
          <Typography.Paragraph type="success">
            指标体系已成功应用到系统中！
          </Typography.Paragraph>
          <Typography.Paragraph>
            您可以在总览页面查看新的指标体系，也可以在各个专题页面查看详细的指标数据。
          </Typography.Paragraph>
        </Card>
      )}

      <Modal
        title="历史记录"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={null}
        width={800}
      >
        {history.length === 0 ? (
          <Empty description="暂无历史记录" />
        ) : (
          <Table
            columns={[
              { title: '时间', dataIndex: 'timestamp', render: (t: string) => new Date(t).toLocaleString('zh-CN') },
              { title: '战略目标', dataIndex: ['input', 'objective'], ellipsis: true },
              { title: '规划周期', dataIndex: ['input', 'period'], render: (p: string) => (p === 'annual' ? '年度' : '三年') },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Button type="link" onClick={() => handleViewHistory(record)}>
                    查看
                  </Button>
                ),
              },
            ]}
            dataSource={history}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        )}
      </Modal>

      <Modal
        title="确认应用到系统"
        open={showApplyModal}
        onOk={handleApply}
        onCancel={() => setShowApplyModal(false)}
      >
        <Typography.Paragraph>
          确认要将当前的指标体系应用到系统中吗？
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          注意：原有的指标将被保留在历史记录中，不会被删除。
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
