import {
  AlertOutlined,
  BarChartOutlined,
  BuildOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FundOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Layout, Menu, Select, Space, Switch, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { roleOptions } from '../../mocks/datasets/permissions';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { useFilterStore } from '../../store/filter/useFilterStore';
import { getMenusByRole } from '../../store/permission/permission';
import { useThemeStore } from '../../store/theme/useThemeStore';
import type { UserRole } from '../../types/app';

const { Sider, Header, Content } = Layout;
const { RangePicker } = DatePicker;

const iconMap: Record<string, React.ReactNode> = {
  overview: <DashboardOutlined />,
  sales: <BarChartOutlined />,
  production: <BuildOutlined />,
  rd: <ExperimentOutlined />,
  finance: <DollarOutlined />,
  line: <FundOutlined />,
  alerts: <AlertOutlined />,
  strategy: <ToolOutlined />,
  settings: <SettingOutlined />,
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const filter = useFilterStore();
  const menus = useMemo(() => getMenusByRole(role), [role]);
  const selectedKey = menus.find((item) => item.path === location.pathname)?.key;

  useEffect(() => {
    if (!menus.some((item) => item.path === location.pathname) && menus[0]) {
      navigate(menus[0].path, { replace: true });
    }
  }, [location.pathname, menus, navigate]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }
    const timer = window.setTimeout(() => {
      const targetId = location.hash.slice(1);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

  const onDateChange = (values: null | [Dayjs | null, Dayjs | null]) => {
    if (!values?.[0] || !values[1]) {
      return;
    }
    filter.update({
      dateRange: [values[0].format('YYYY-MM-DD'), values[1].format('YYYY-MM-DD')],
    });
  };

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth={80}>
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>驾驶舱 Demo</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menus.map((m) => ({
            key: m.key,
            icon: iconMap[m.key],
            label: m.label,
          }))}
          onClick={({ key }) => {
            const target = menus.find((m) => m.key === key);
            if (target) {
              navigate(target.path);
            }
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: 'var(--app-header-bg)',
            borderBottom: '1px solid var(--app-border)',
            height: 'auto',
            lineHeight: 1,
            padding: 12,
            backdropFilter: 'blur(6px)',
          }}
        >
          <Space wrap size={10}>
            <Select<UserRole>
              style={{ width: 140 }}
              value={role}
              options={roleOptions}
              onChange={(nextRole) => {
                useAuthStore.setState({ role: nextRole });
                const nextMenus = getMenusByRole(nextRole);
                if (!nextMenus.some((item) => item.path === location.pathname)) {
                  navigate(nextMenus[0].path);
                }
              }}
            />
            <RangePicker
              allowClear={false}
              value={[dayjs(filter.dateRange[0]), dayjs(filter.dateRange[1])]}
              onChange={onDateChange}
            />
            <Select
              style={{ width: 120 }}
              value={filter.caliber}
              onChange={(value) => filter.update({ caliber: value })}
              options={[
                { label: '合并口径', value: 'combined' },
                { label: '管理口径', value: 'management' },
              ]}
            />
            <Select
              style={{ width: 110 }}
              value={filter.orgLevel}
              onChange={(value) => filter.update({ orgLevel: value })}
              options={[
                { label: '集团', value: 'group' },
                { label: '子公司', value: 'subsidiary' },
              ]}
            />
            <Select
              style={{ width: 120 }}
              value={filter.marketScope}
              onChange={(value) => filter.update({ marketScope: value })}
              options={[
                { label: '全部市场', value: 'all' },
                { label: '国内营销', value: 'domestic' },
                { label: '国际营销', value: 'international' },
              ]}
            />
            <Tag color="blue">{`筛选区间 ${filter.dateRange[0]} 至 ${filter.dateRange[1]}`}</Tag>
            <Tag>{`主题 ${mode === 'business' ? '商务' : '科技'}`}</Tag>
            <Space size={4}>
              <Typography.Text>商务</Typography.Text>
              <Switch
                checked={mode === 'tech'}
                onChange={(checked) => setMode(checked ? 'tech' : 'business')}
              />
              <Typography.Text>科技</Typography.Text>
            </Space>
            <Button
              onClick={() =>
                filter.update({
                  dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                })
              }
            >
              MTD
            </Button>
            <Button
              onClick={() =>
                filter.update({
                  dateRange: [dayjs().startOf('year').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
                })
              }
            >
              YTD
            </Button>
            <Button onClick={filter.reset}>重置筛选</Button>
            <Button
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              退出
            </Button>
          </Space>
        </Header>
        <Content className="dashboard-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
