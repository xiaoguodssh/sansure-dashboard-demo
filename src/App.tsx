import { RouterProvider } from 'react-router-dom';
import { router } from './app/router/router';
import { AppThemeProvider } from './app/providers/AppThemeProvider';
import './theme/tokens/global.css';

export default function App() {
  return (
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  );
}
