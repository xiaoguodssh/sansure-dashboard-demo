import { describe, expect, it } from 'vitest';
import { canAccessPath, getMenusByRole } from './permission';

describe('permission utils', () => {
  it('chairman should see settings menu', () => {
    const menus = getMenusByRole('chairman');
    expect(menus.some((item) => item.path === '/settings')).toBe(true);
  });

  it('finance lead should not access sales page', () => {
    expect(canAccessPath('finance_lead', '/sales')).toBe(false);
  });
});
