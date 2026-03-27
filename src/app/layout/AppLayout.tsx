import {
  AlertOutlined,
  BarChartOutlined,
  BuildOutlined,
  DashboardOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FundOutlined,
  MenuOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Drawer, Grid, Layout, Menu, Select, Space, Switch, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { roleOptions } from '../../mocks/datasets/permissions';
import { useAuthStore } from '../../store/auth/useAuthStore';
import { useFilterStore } from '../../store/filter/useFilterStore';
import { getMenusByRole } from '../../store/permission/permission';
import { useThemeStore } from '../../store/theme/useThemeStore';
import type { UserRole } from '../../types/app';

const { Sider, Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;
  const isLargeScreen = screens.xl;

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

  const handleMenuClick = (key: string) => {
    const target = menus.find((m) => m.key === key);
    if (target) {
      navigate(target.path);
      setDrawerVisible(false);
    }
  };

  const menuItems = menus.map((m) => ({
    key: m.key,
    icon: iconMap[m.key],
    label: m.label,
  }));

  const siderMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={selectedKey ? [selectedKey] : []}
      items={menuItems}
      onClick={({ key }) => handleMenuClick(key)}
    />
  );

  const filterContent = (
    <Space wrap size={isMobile ? 6 : 10}>
      <Select<UserRole>
        style={{ width: isMobile ? '100%' : 140 }}
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
        style={{ width: isMobile ? '100%' : 'auto' }}
        value={[dayjs(filter.dateRange[0]), dayjs(filter.dateRange[1])]}
        onChange={onDateChange}
      />
      {!isMobile && (
        <>
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
        </>
      )}
      {!isMobile && <Tag color="blue">{`筛选区间 ${filter.dateRange[0]} 至 ${filter.dateRange[1]}`}</Tag>}
      {!isMobile && <Tag>{`主题 ${mode === 'business' ? '商务' : '科技'}`}</Tag>}
      {!isMobile && (
        <Space size={4}>
          <Typography.Text>商务</Typography.Text>
          <Switch
            checked={mode === 'tech'}
            onChange={(checked) => setMode(checked ? 'tech' : 'business')}
          />
          <Typography.Text>科技</Typography.Text>
        </Space>
      )}
      {!isMobile && (
        <>
          <Button
            size={isMobile ? 'small' : 'middle'}
            onClick={() =>
              filter.update({
                dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
              })
            }
          >
            MTD
          </Button>
          <Button
            size={isMobile ? 'small' : 'middle'}
            onClick={() =>
              filter.update({
                dateRange: [dayjs().startOf('year').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
              })
            }
          >
            YTD
          </Button>
          <Button size={isMobile ? 'small' : 'middle'} onClick={filter.reset}>
            重置筛选
          </Button>
        </>
      )}
      <Button
        size={isMobile ? 'small' : 'middle'}
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        退出
      </Button>
    </Space>
  );

  return (
    <Layout className="app-shell">
      {isMobile ? (
        <>
          <Drawer
            title="驾驶舱 Demo"
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={240}
            styles={{ body: { padding: 0 } }}
          >
            {siderMenu}
          </Drawer>
          <Layout>
            <Header
              className="app-header"
              style={{
                background: 'var(--app-header-bg)',
                borderBottom: '1px solid var(--app-border)',
                height: 'auto',
                lineHeight: 1,
                padding: isMobile ? 8 : 12,
                backdropFilter: 'blur(6px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 8 : 0 }}>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setDrawerVisible(true)}
                  style={{ color: 'var(--app-text)' }}
                />
                <Typography.Text strong style={{ color: 'var(--app-title)' }}>驾驶舱 Demo</Typography.Text>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setFilterVisible(!filterVisible)}
                  style={{ color: 'var(--app-text)' }}
                >
                  {filterVisible ? '收起' : '筛选'}
                </Button>
              </div>
              {filterVisible && filterContent}
            </Header>
            <Content className="dashboard-content">
              <Outlet />
            </Content>
          </Layout>
        </>
      ) : (
        <>
          <Sider
            breakpoint="lg"
            collapsedWidth={isTablet ? 80 : 200}
            width={isLargeScreen ? 220 : 200}
            collapsed={isTablet}
          >
            <div style={{ color: '#fff', padding: 16, fontWeight: 600, textAlign: isTablet ? 'center' : 'left' }}>
              {isTablet ? 'Demo' : '驾驶舱 Demo'}
            </div>
            {siderMenu}
          </Sider>
          <Layout>
            <Header
              className="app-header"
              style={{
                background: 'var(--app-header-bg)',
                borderBottom: '1px solid var(--app-border)',
                height: 'auto',
                lineHeight: 1,
                padding: isTablet ? 8 : 12,
                backdropFilter: 'blur(6px)',
              }}
            >
              {filterContent}
            </Header>
            <Content className="dashboard-content">
              <Outlet />
            </Content>
          </Layout>
        </>
      )}
    </Layout>
  );
}
