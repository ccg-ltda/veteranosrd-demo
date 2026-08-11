import { useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import GlobalUi from './components/legacy/GlobalUi';
import DashboardPage from './pages/DashboardPage';
import PipelinePage from './pages/PipelinePage';
import MarketingPage from './pages/MarketingPage';
import GestionesPage from './pages/GestionesPage';
import CotizacionesPage from './pages/CotizacionesPage';
import ProductosPage from './pages/ProductosPage';
import MetasPage from './pages/MetasPage';
import EmpresasPage from './pages/EmpresasPage';
import ClientesPage from './pages/ClientesPage';
import GestionPage from './pages/GestionPage';
import SmsPage from './pages/SmsPage';
import AdsPage from './pages/AdsPage';
import AutomatizacionesPage from './pages/AutomatizacionesPage';
import AgendaPage from './pages/AgendaPage';
import CorreoPage from './pages/CorreoPage';
import ReportesPage from './pages/ReportesPage';
import ApisPage from './pages/ApisPage';
import ConfigPage from './pages/ConfigPage';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}legacy/crm.js`;
    script.dataset.crmRuntime = 'true';
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <>
      <div id="sidebarOverlay" onClick={() => window.toggleSidebar?.(false)} />
      <div id="app">
        <Sidebar />
        <div id="content">
          <Header />
          <main id="main">
            <DashboardPage />
            <PipelinePage />
            <MarketingPage />
            <GestionesPage />
            <CotizacionesPage />
            <ProductosPage />
            <MetasPage />
            <EmpresasPage />
            <ClientesPage />
            <GestionPage />
            <SmsPage />
            <AdsPage />
            <AutomatizacionesPage />
            <AgendaPage />
            <CorreoPage />
            <ReportesPage />
            <ApisPage />
            <ConfigPage />
          </main>
        </div>
      </div>
      <GlobalUi />
    </>
  );
}
