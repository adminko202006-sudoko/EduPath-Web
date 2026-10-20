import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext';
import RouteBoundary from './components/RouteBoundary';
import ErrorDialogHost from './components/ui/ErrorDialogHost';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorDialogHost />
          <RouteBoundary>
            <AppRoutes />
          </RouteBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
