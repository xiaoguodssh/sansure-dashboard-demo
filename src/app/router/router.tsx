import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from '../../RequireAuth';
import { AlertsPage } from '../../pages/alerts/AlertsPage';
import { FinancePage } from '../../pages/finance/FinancePage';
import { LinePage } from '../../pages/line/LinePage';
import { LoginPage } from '../../pages/login/LoginPage';
import { OverviewPage } from '../../pages/overview/OverviewPage';
import { ProductionPage } from '../../pages/production/ProductionPage';
import { RdPage } from '../../pages/rd/RdPage';
import { SalesPage } from '../../pages/sales/SalesPage';
import { SettingsPage } from '../../pages/settings/SettingsPage';
import { StrategyPage } from '../../pages/strategy/StrategyPage';
import { AppLayout } from '../layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/overview" replace /> },
          { path: '/overview', element: <OverviewPage /> },
          { path: '/sales', element: <SalesPage /> },
          { path: '/production', element: <ProductionPage /> },
          { path: '/rd', element: <RdPage /> },
          { path: '/finance', element: <FinancePage /> },
          { path: '/line', element: <LinePage /> },
          { path: '/alerts', element: <AlertsPage /> },
          { path: '/strategy', element: <StrategyPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
