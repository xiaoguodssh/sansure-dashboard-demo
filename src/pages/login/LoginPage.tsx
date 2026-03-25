import { Button, Card, Select, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { roleOptions } from '../../mocks/datasets/permissions';
import { useAuthStore } from '../../store/auth/useAuthStore';
import type { UserRole } from '../../types/app';

export function LoginPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const login = useAuthStore((state) => state.login);

  const handleEnter = () => {
    login(role);
    navigate('/overview');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: 460 }}>
        <Typography.Title level={3}>集团经营管理驾驶舱 Demo</Typography.Title>
        <Typography.Paragraph type="secondary">
          请选择演示角色进入系统（本期：董事长+高管分级可见）。
        </Typography.Paragraph>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select<UserRole>
            style={{ width: '100%' }}
            value={role}
            onChange={(value) => useAuthStore.setState({ role: value })}
            options={roleOptions}
          />
          <Button type="primary" block onClick={handleEnter}>
            进入驾驶舱
          </Button>
        </Space>
      </Card>
    </div>
  );
}
