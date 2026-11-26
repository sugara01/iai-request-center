import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from 'next-themes';

import { LanguageProvider } from '@/lib/localization';
import Layout from '@/pages/_layout';
import { AdminRoute } from '@/components/admin-route';
import { AuthRoute } from '@/components/auth-route';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/system/error-boundary';

import HomePage from '@/pages/index';
import NewRequestPage from '@/pages/new-request';
import RequestCenterPage from '@/pages/request-center';
import VehicleRequestPage from '@/pages/vehicle-request';
import RequestDetailPage from '@/pages/request-detail';
import AdminMonitoringPage from '@/pages/admin-monitoring';
import VehicleAdminPage from '@/pages/vehicle-admin';

import RequesterGuidePage from '@/pages/requester-guide';
import UserManagementPage from '@/pages/user-management';
import PendingApprovalsPage from '@/pages/pending-approvals';
import NotificationsPage from '@/pages/notifications';
import LoginPage from '@/pages/login';
import ProfilePage from '@/pages/profile';
import ChangePasswordPage from '@/pages/change-password';
import PowerAutomateGuidePage from '@/pages/power-automate-guide';

import NotFoundPage from '@/pages/not-found';
import { MealStoreProvider } from '@/lib/meal-store';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="iai-theme-mode">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary resetQueryCache>
          <JotaiProvider>
            <LanguageProvider>
              <MealStoreProvider>
                <Toaster richColors />
                <Router>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/change-password" element={<AuthRoute><ChangePasswordPage /></AuthRoute>} />
                    <Route path="/" element={<AuthRoute><Layout /></AuthRoute>}>
                      <Route index element={<HomePage />} />
                      <Route path="buat-request" element={<RequestCenterPage />} />
                      <Route path="request-kendaraan" element={<VehicleRequestPage />} />
                      <Route path="request-extra-meal" element={<NewRequestPage />} />
                      <Route path="panduan-requester" element={<RequesterGuidePage />} />
                      <Route path="inbox/approvals" element={<PendingApprovalsPage />} />
                      <Route path="inbox/notifications" element={<NotificationsPage />} />
                      <Route path="request/:id" element={<RequestDetailPage />} />
                      <Route path="admin-kendaraan" element={<AdminRoute role="vehicle"><VehicleAdminPage /></AdminRoute>} />
                      <Route path="admin-meal" element={<AdminRoute role="meal"><AdminMonitoringPage /></AdminRoute>} />
                      <Route path="panduan-power-automate" element={<AdminRoute role="request-admin"><PowerAutomateGuidePage /></AdminRoute>} />
                      <Route path="kelola-pengguna" element={<AdminRoute role="user-admin"><UserManagementPage /></AdminRoute>} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </Router>
              </MealStoreProvider>
            </LanguageProvider>
          </JotaiProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
