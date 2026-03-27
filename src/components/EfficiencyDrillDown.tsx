import { Card, Progress, Table, Typography, Breadcrumb, Space, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { HrEfficiencyData, HrEfficiencyDepartment, HrEfficiencyEmployee } from '../types/dashboardData';

type DrillLevel = 'company' | 'department' | 'employee';

function getScoreColor(score: number): string {
  if (score >= 80) return '#2e7d32';
  if (score >= 60) return '#c77800';
  return '#cf1322';
}

interface EfficiencyDrillDownProps {
  data: HrEfficiencyData;
}

export function EfficiencyDrillDown({ data }: EfficiencyDrillDownProps) {
  const [level, setLevel] = useState<DrillLevel>('company');
  const [selectedDepartment, setSelectedDepartment] = useState<HrEfficiencyDepartment | null>(null);

  const handleDepartmentClick = (dept: HrEfficiencyDepartment) => {
    setSelectedDepartment(dept);
    setLevel('department');
  };

  const handleBack = () => {
    if (level === 'department') {
      setSelectedDepartment(null);
      setLevel('company');
    }
  };

  const renderCompanyView = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Typography.Title level={4}>全公司能效评分</Typography.Title>
        <Progress
          type="dashboard"
          percent={data.companyScore}
          strokeColor={getScoreColor(data.companyScore)}
          format={(percent) => (
            <span style={{ fontSize: 28, fontWeight: 'bold', color: getScoreColor(data.companyScore || 0) }}>
              {percent}
            </span>
          )}
          size={160}
        />
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          综合能效评分（满分100分）
        </Typography.Text>
      </div>

      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
        部门能效排名
      </Typography.Title>
      <Table
        dataSource={data.departments}
        rowKey="id"
        pagination={false}
        size="small"
        onRow={(record) => ({
          onClick: () => handleDepartmentClick(record),
          style: { cursor: 'pointer' },
        })}
        columns={[
          {
            title: '排名',
            width: 60,
            render: (_: unknown, __: unknown, index: number) => (
              <Tag color={index < 3 ? 'gold' : 'default'}>{index + 1}</Tag>
            ),
          },
          {
            title: '部门名称',
            dataIndex: 'name',
            render: (name: string) => <a>{name}</a>,
          },
          {
            title: '能效评分',
            dataIndex: 'score',
            render: (score: number) => (
              <Space>
                <Progress
                  percent={score}
                  size="small"
                  style={{ width: 100 }}
                  strokeColor={getScoreColor(score)}
                  showInfo={false}
                />
                <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>{score.toFixed(1)}</span>
              </Space>
            ),
            sorter: (a: HrEfficiencyDepartment, b: HrEfficiencyDepartment) => a.score - b.score,
            defaultSortOrder: 'descend',
          },
          {
            title: '人数',
            dataIndex: 'employeeCount',
            width: 80,
          },
        ]}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
        点击部门名称可查看部门员工能效详情
      </Typography.Text>
    </div>
  );

  const renderDepartmentView = () => {
    if (!selectedDepartment) return null;

    const avgScore = selectedDepartment.employees.reduce((sum: number, emp: HrEfficiencyEmployee) => sum + emp.score, 0) / selectedDepartment.employees.length;

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb
            items={[
              { title: <a onClick={handleBack}>全公司</a> },
              { title: selectedDepartment.name },
            ]}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={4}>{selectedDepartment.name} 能效评分</Typography.Title>
          <Progress
            type="dashboard"
            percent={selectedDepartment.score}
            strokeColor={getScoreColor(selectedDepartment.score)}
            format={(percent) => (
              <span style={{ fontSize: 28, fontWeight: 'bold', color: getScoreColor(selectedDepartment.score) }}>
                {percent}
              </span>
            )}
            size={140}
          />
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            部门平均能效评分：{avgScore.toFixed(1)} 分
          </Typography.Text>
        </div>

        <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
          员工能效明细
        </Typography.Title>
        <Table
          dataSource={selectedDepartment.employees}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: '姓名',
              dataIndex: 'name',
              render: (name: string, record: HrEfficiencyEmployee) => (
                <Space>
                  <span>{name}</span>
                  {record.score >= 85 && <Tag color="green">优秀</Tag>}
                  {record.score < 60 && <Tag color="red">待提升</Tag>}
                </Space>
              ),
            },
            {
              title: '职位',
              dataIndex: 'position',
              width: 120,
            },
            {
              title: '能效评分',
              dataIndex: 'score',
              render: (score: number) => (
                <Space>
                  <Progress
                    percent={score}
                    size="small"
                    style={{ width: 80 }}
                    strokeColor={getScoreColor(score)}
                    showInfo={false}
                  />
                  <span style={{ color: getScoreColor(score), fontWeight: 'bold' }}>{score}</span>
                </Space>
              ),
              sorter: (a: HrEfficiencyEmployee, b: HrEfficiencyEmployee) => a.score - b.score,
              defaultSortOrder: 'descend',
            },
          ]}
        />
      </div>
    );
  };

  return (
    <Card
      title={
        level === 'company' ? (
          <span>
            能效指标
            <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8, fontWeight: 'normal' }}>
              （支持钻取查看）
            </Typography.Text>
          </span>
        ) : (
          <Space>
            <ArrowLeftOutlined onClick={handleBack} style={{ cursor: 'pointer' }} />
            <span>能效指标 - {selectedDepartment?.name}</span>
          </Space>
        )
      }
    >
      {level === 'company' && renderCompanyView()}
      {level === 'department' && renderDepartmentView()}
    </Card>
  );
}
