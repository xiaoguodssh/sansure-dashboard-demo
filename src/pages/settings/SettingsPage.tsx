import { Button, Card, Form, Input, Space, Table, Typography } from 'antd';
import { dashboardData } from '../../services/mock/dashboardData';

export function SettingsPage() {
  return (
    <div>
      <h1 className="page-title">系统设置</h1>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Card title="国际区域分组配置（Demo）">
          <Form layout="vertical">
            <Form.Item label="区域名称">
              <Input placeholder="例如：西欧区域" />
            </Form.Item>
            <Form.Item label="归属分组/公司">
              <Input placeholder="例如：法国分公司" />
            </Form.Item>
            <Form.Item label="生效日期">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Button type="primary">新增映射（演示）</Button>
          </Form>
        </Card>

        <Card title="当前映射样例（来自数据集）">
          <Table
            rowKey={(row) => `${row.region}-${row.regionGroup}`}
            dataSource={dashboardData.sales.regionMappings}
            pagination={false}
            columns={[
              { title: '国际区域', dataIndex: 'region' },
              { title: '分组/公司', dataIndex: 'regionGroup' },
              { title: '生效日期', dataIndex: 'effectiveFrom' },
            ]}
          />
        </Card>

        <Card>
          <Typography.Text type="secondary">
            数据更新时间：{dashboardData.meta.generatedAt}；时间范围：
            {dashboardData.meta.startMonth} 至 {dashboardData.meta.latestMonth}
          </Typography.Text>
        </Card>
      </Space>
    </div>
  );
}
