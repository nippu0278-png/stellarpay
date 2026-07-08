import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ToastContainer } from './components/Toast';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { SendPayment } from './pages/SendPayment';
import { Settings } from './pages/Settings';
import { LiveEvents } from './pages/LiveEvents';
import { ContractExplorer } from './pages/ContractExplorer';
import { StudentRewards } from './pages/StudentRewards';

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/send" element={<DashboardLayout><SendPayment /></DashboardLayout>} />
          <Route path="/rewards" element={<DashboardLayout><StudentRewards /></DashboardLayout>} />
          <Route path="/events" element={<DashboardLayout><LiveEvents /></DashboardLayout>} />
          <Route path="/explorer" element={<DashboardLayout><ContractExplorer /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
