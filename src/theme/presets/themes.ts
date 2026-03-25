import { theme, type ThemeConfig } from 'antd';

export const businessTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0A5CA8',
    colorSuccess: '#2A9D5B',
    colorWarning: '#E6A23C',
    colorError: '#D64545',
    colorInfo: '#0A5CA8',
    borderRadius: 10,
    fontSize: 14,
  },
};

export const techTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#00A6FB',
    colorSuccess: '#00C48C',
    colorWarning: '#FFB020',
    colorError: '#FF5D73',
    colorInfo: '#00A6FB',
    borderRadius: 12,
    fontSize: 14,
    colorBgBase: '#0D1B2A',
    colorTextBase: '#D7E9FF',
  },
};
