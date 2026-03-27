import { useState } from 'react';
import { Button, Card, Input, message, Select, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { roleOptions } from '../../mocks/datasets/permissions';
import { useAuthStore } from '../../store/auth/useAuthStore';
import type { UserRole } from '../../types/app';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'sansure123!@#';

export function LoginPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isChairman = role === 'chairman';

  const handleEnter = () => {
    if (!isChairman) {
      message.warning('当前仅董事长角色可登录系统');
      return;
    }
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      message.error('账号或密码错误');
      return;
    }
    login(role);
    navigate('/overview');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card style={{ width: 460 }}>
        <Typography.Title level={3}>集团经营管理驾驶舱 Demo</Typography.Title>
        <Typography.Paragraph type="secondary">
          请选择演示角色进入系统（当前仅董事长角色可登录）。
        </Typography.Paragraph>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select<UserRole>
            style={{ width: '100%' }}
            value={role}
            onChange={(value) => useAuthStore.setState({ role: value })}
            options={roleOptions}
          />
          {isChairman && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input.Password
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Space>
          )}
          <Button
            type="primary"
            block
            onClick={handleEnter}
            disabled={isChairman && (!username || !password)}
          >
            进入驾驶舱
          </Button>
        </Space>
      </Card>
    </div>
  );
}
