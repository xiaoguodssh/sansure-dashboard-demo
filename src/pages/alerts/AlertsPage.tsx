import { Button, Card, Space, Table, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { dashboardData } from '../../services/mock/dashboardData';
import { useFilterStore } from '../../store/filter/useFilterStore';

interface AlertItem {
  key: string;
  module: string;
  org: string;
  metric: string;
  level: '红' | '黄' | '绿';
  reason: string;
  status: '待处理' | '已读' | '忽略';
}

function initRows(): AlertItem[] {
  return dashboardData.alerts.map((item, idx) => ({
    key: String(idx + 1),
    module: item.module,
    org: item.org,
    metric: `${item.metric} (${item.value}%)`,
    level: item.level,
    reason: item.reason,
    status: '待处理',
  }));
}

export function AlertsPage() {
  const filter = useFilterStore();
  const [rows, setRows] = useState<AlertItem[]>(initRows);

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (filter.marketScope === 'domestic') {
        return !['中东非洲', '泰越', '西欧', '独联体', '拉美', '法国分公司'].some((k) =>
          row.org.includes(k),
        );
      }
      if (filter.marketScope === 'international') {
        return ['中东非洲', '泰越', '西欧', '独联体', '拉美', '法国分公司'].some((k) =>
          row.org.includes(k),
        );
      }
      return true;
    });
  }, [rows, filter.marketScope]);

  const summary = useMemo(() => {
    const red = visibleRows.filter((r) => r.level === '红').length;
    const yellow = visibleRows.filter((r) => r.level === '黄').length;
    const green = visibleRows.filter((r) => r.level === '绿').length;
    return { red, yellow, green };
  }, [visibleRows]);

  const updateStatus = (key: string, status: AlertItem['status']) => {
    setRows((prev) => prev.map((item) => (item.key === key ? { ...item, status } : item)));
  };

  return (
    <div>
      <h1 className="page-title">预警中心（顶部市场筛选已生效）</h1>
      <Card style={{ marginBottom: 12 }}>
        红色 {summary.red} 条，黄色 {summary.yellow} 条，绿色 {summary.green} 条（当前市场：
        {filter.marketScope === 'all'
          ? '全部'
          : filter.marketScope === 'domestic'
            ? '国内'
            : '国际'}
        ）
      </Card>
      <Card>
        <Table
          rowKey="key"
          dataSource={visibleRows}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '模块', dataIndex: 'module' },
            { title: '组织', dataIndex: 'org' },
            { title: '指标', dataIndex: 'metric' },
            {
              title: '等级',
              dataIndex: 'level',
              render: (level: AlertItem['level']) => (
                <Tag color={level === '红' ? 'red' : level === '黄' ? 'gold' : 'green'}>{level}</Tag>
              ),
            },
            { title: '异常原因', dataIndex: 'reason' },
            { title: '状态', dataIndex: 'status' },
            {
              title: '操作',
              render: (_: unknown, record: AlertItem) => (
                <Space>
                  <Button size="small" onClick={() => updateStatus(record.key, '已读')}>
                    标记已读
                  </Button>
                  <Button size="small" onClick={() => updateStatus(record.key, '忽略')}>
                    忽略
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
