import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ImportPage from './pages/ImportPage'
import ClaimsPage from './pages/ClaimsPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportPage from './pages/ReportPage'
import RulesPage from './pages/RulesPage'
import OverstayPage from './pages/OverstayPage'
import {
  DiagnosesPage,
  ProceduresPage,
  CmgsPage,
  CaseTypesPage,
  DischargesPage,
} from './pages/MasterDataPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="rules" element={<RulesPage />} />
              <Route path="overstay" element={<OverstayPage />} />
              <Route path="diagnoses" element={<DiagnosesPage />} />
              <Route path="procedures" element={<ProceduresPage />} />
              <Route path="cmgs" element={<CmgsPage />} />
              <Route path="casetypes" element={<CaseTypesPage />} />
              <Route path="discharges" element={<DischargesPage />} />
              <Route path="hospitals" element={<Navigate to="/settings" replace />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
