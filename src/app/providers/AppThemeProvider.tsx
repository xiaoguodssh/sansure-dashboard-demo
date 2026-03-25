import { ConfigProvider } from 'antd';
import { useEffect, type PropsWithChildren } from 'react';
import { businessTheme, techTheme } from '../../theme/presets/themes';
import { useThemeStore } from '../../store/theme/useThemeStore';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-mode', mode);
  }, [mode]);

  return <ConfigProvider theme={mode === 'business' ? businessTheme : techTheme}>{children}</ConfigProvider>;
}
