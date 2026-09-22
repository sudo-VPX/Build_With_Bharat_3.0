import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api.js';

// Layout
import AppLayout from './components/layout/AppLayout';

// UI Components
import Toast from './components/ui/Toast';
import ReviewModal from './components/ui/ReviewModal';
import RemediationModal from './components/ui/RemediationModal';

// Pages
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import IdentitiesPage from './pages/IdentitiesPage';
import IdentityDetail from './pages/IdentityDetail';
import DriftPage from './pages/DriftPage';
import RecommendationsPage from './pages/RecommendationsPage';
import TempAccessPage from './pages/TempAccessPage';
import AuditPage from './pages/AuditPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [route, setRoute] = useState('/');
  const [summary, setSummary] = useState(null);
  const [identities, setIdentities] = useState([]);
  const [findings, setFindings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [identityDetail, setIdentityDetail] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [mode, setMode] = useState('demo');
  const [toast, setToast] = useState('');
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewIdentity, setReviewIdentity] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [remPlan, setRemPlan] = useState(null);

  const navigate = (path) => {
    setRoute(path);
    window.scrollTo(0, 0);
    if (path.startsWith('/app/identity/')) {
      const id = path.replace('/app/identity/', '');
      api.getIdentity(id).then(setIdentityDetail).catch(console.error);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const loadAll = useCallback(() => {
    api.getSummary().then(d => { setSummary(d); setMode(d.mode); }).catch(console.error);
    api.getIdentities().then(setIdentities).catch(console.error);
    api.getFindings().then(setFindings).catch(console.error);
    api.getRecommendations().then(setRecommendations).catch(console.error);
    if (route.startsWith('/app/identity/')) {
      const id = route.replace('/app/identity/', '');
      api.getIdentity(id).then(setIdentityDetail).catch(console.error);
    }
  }, [route]);

  useEffect(() => {
    if (route.startsWith('/app')) {
      loadAll();
      const intervalId = setInterval(loadAll, 5000); // 5 seconds real-time polling
      return () => clearInterval(intervalId);
    }
  }, [route, loadAll]);

  const handleRunScan = async (scanMode) => {
    setScanning(true);
    try {
      const result = await api.runScan(scanMode);
      setMode(result.mode);
      showToast(`${scanMode === 'live' ? '🟢 Live AWS' : '🟡 Demo'} scan complete — ${result.identities_scanned} identities loaded.`);
      await loadAll();
    } catch (e) {
      showToast(`⚠️ Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleReview = (item, identityName) => {
    setReviewItem(item);
    setReviewIdentity(identityName);
  };

  const handleApprove = async () => {
    if (!reviewItem) return;
    setReviewLoading(true);
    try {
      await api.reviewRecommendation(reviewItem.id, 'approved', 'Reviewed via dashboard');
      showToast('✅ Recommendation approved. No AWS permission was changed.');
      setReviewItem(r => ({ ...r, status: 'APPROVED' }));
      await loadAll();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewItem) return;
    setReviewLoading(true);
    try {
      await api.reviewRecommendation(reviewItem.id, 'rejected', 'Reviewed via dashboard');
      showToast('❌ Recommendation rejected. No action taken.');
      setReviewItem(r => ({ ...r, status: 'REJECTED' }));
      await loadAll();
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleViewPlan = async (recId) => {
    try {
      const plan = await api.getRemediationPlan(recId);
      setRemPlan(plan);
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    }
  };

  const renderAppContent = () => {
    if (route === '/app/dashboard') return <Dashboard summary={summary} identities={identities} />;
    if (route === '/app/users') return <IdentitiesPage identities={identities} navigate={navigate} />;
    if (route.startsWith('/app/identity/')) return <IdentityDetail identity={identityDetail} onReview={handleReview} navigate={navigate} />;
    if (route === '/app/drift') return <DriftPage findings={findings} />;
    if (route === '/app/temp') return <TempAccessPage />;
    if (route === '/app/recs') return <RecommendationsPage recommendations={recommendations} onReview={handleReview} onViewPlan={handleViewPlan} />;
    if (route === '/app/audit') return <AuditPage />;
    if (route === '/app/settings') return <SettingsPage navigate={navigate} mode={mode} />;
    return <Dashboard summary={summary} identities={identities} />;
  };

  return (
    <>
      {route === '/' && <LandingPage navigate={navigate} />}
      {route === '/pricing' && <PricingPage navigate={navigate} />}
      {route === '/login' && <LoginPage navigate={navigate} />}
      {route.startsWith('/app') && (
        <AppLayout currentRoute={route} navigate={navigate} onRunScan={handleRunScan} scanning={scanning} mode={mode}>
          {renderAppContent()}
        </AppLayout>
      )}

      {/* Modals */}
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          identity={reviewIdentity}
          onClose={() => setReviewItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={reviewLoading}
        />
      )}
      {remPlan && <RemediationModal plan={remPlan} onClose={() => setRemPlan(null)} />}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  );
}
