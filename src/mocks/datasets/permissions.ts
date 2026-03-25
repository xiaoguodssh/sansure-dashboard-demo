import type { MenuPermission, RoleOption } from '../../types/app';

export const roleOptions: RoleOption[] = [
  { label: '董事长', value: 'chairman' },
  { label: '总裁', value: 'president' },
  { label: '财务负责人', value: 'finance_lead' },
  { label: '销售负责人', value: 'sales_lead' },
  { label: '研发负责人', value: 'rd_lead' },
  { label: '生产负责人', value: 'production_lead' },
];

export const menuPermissions: MenuPermission[] = [
  {
    key: 'overview',
    label: '总览',
    path: '/overview',
    roles: ['chairman', 'president', 'finance_lead', 'sales_lead', 'rd_lead', 'production_lead'],
  },
  {
    key: 'sales',
    label: '销售',
    path: '/sales',
    roles: ['chairman', 'president', 'sales_lead'],
  },
  {
    key: 'production',
    label: '人力',
    path: '/production',
    roles: ['chairman', 'president', 'production_lead'],
  },
  {
    key: 'rd',
    label: '研发',
    path: '/rd',
    roles: ['chairman', 'president', 'rd_lead'],
  },
  {
    key: 'finance',
    label: '财务',
    path: '/finance',
    roles: ['chairman', 'president', 'finance_lead'],
  },
  {
    key: 'line',
    label: '事业部',
    path: '/line',
    roles: ['chairman', 'president', 'production_lead', 'sales_lead'],
  },
  {
    key: 'alerts',
    label: '预警中心',
    path: '/alerts',
    roles: ['chairman', 'president', 'finance_lead', 'sales_lead', 'rd_lead', 'production_lead'],
  },
  {
    key: 'strategy',
    label: '方法论框架',
    path: '/strategy',
    roles: ['chairman', 'president'],
  },
  {
    key: 'settings',
    label: '设置',
    path: '/settings',
    roles: ['chairman', 'president'],
  },
];
