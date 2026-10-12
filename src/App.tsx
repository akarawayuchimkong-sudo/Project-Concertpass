/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConcertPassProvider, useConcertPass } from './context/ConcertPassContext';
import { Navbar } from './components/Navbar';
import { DiscoveryView } from './components/DiscoveryView';
import { SeatMap } from './components/SeatMap';
import { CheckoutModal } from './components/CheckoutModal';
import { MyTicketsView } from './components/MyTicketsView';
import { GateScannerView } from './components/GateScannerView';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { RoleAndAuditModal } from './components/RoleAndAuditModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseModal } from './components/SupabaseModal';
import { Footer } from './components/Footer';
import { AlertCircle, X } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'discovery' | 'seat_map' | 'my_tickets' | 'scanner' | 'organizer'>('discovery');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const {
    isLoggedIn,
    userRole,
    setActiveConcertId,
    startCheckout,
    activeConcertId,
    systemNotice,
    setSystemNotice,
  } = useConcertPass();

  React.useEffect(() => {
    if (!isLoggedIn) {
      if (currentTab !== 'discovery') {
        setCurrentTab('discovery');
      }
      return;
    }

    if (userRole === 'organizer') {
      if (currentTab !== 'organizer') {
        setCurrentTab('organizer');
      }
    } else if (userRole === 'gate_staff') {
      if (currentTab !== 'scanner') {
        setCurrentTab('scanner');
      }
    } else if (userRole === 'customer') {
      if (currentTab === 'organizer' || currentTab === 'scanner') {
        setCurrentTab('discovery');
      }
    }
  }, [userRole, isLoggedIn, currentTab]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSelectConcert = (concertId: string) => {
    if (!isLoggedIn) {
      setActiveConcertId(concertId);
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setSystemNotice('กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อเข้าสู่ผังเลือกที่นั่ง');
      return;
    }
    if (userRole === 'organizer') {
      setCurrentTab('organizer');
      return;
    }
    if (userRole === 'gate_staff') {
      setCurrentTab('scanner');
      return;
    }
    setActiveConcertId(concertId);
    setCurrentTab('seat_map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (activeConcertId) {
      const order = startCheckout(activeConcertId);
      if (order) {
        setIsCheckoutOpen(true);
      }
    }
  };

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setCurrentTab('my_tickets');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Banner Notice if seat hold expired or system alert */}
      {systemNotice && (
        <div className="bg-amber-950/80 border-b border-amber-800 text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{systemNotice}</span>
          </div>
          <button
            onClick={() => setSystemNotice(null)}
            className="text-amber-400 hover:text-white p-1 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Navigation (3-Zone Contract) */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenAuthModal={handleOpenAuth}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoggedIn && userRole === 'organizer' ? (
          <OrganizerDashboard onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />
        ) : isLoggedIn && userRole === 'gate_staff' ? (
          <GateScannerView />
        ) : (
          <>
            {currentTab === 'discovery' && (
              <DiscoveryView
                onSelectConcert={handleSelectConcert}
                onOpenAuthModal={handleOpenAuth}
              />
            )}

            {currentTab === 'seat_map' && (
              <SeatMap onProceedToCheckout={handleProceedToCheckout} />
            )}

            {currentTab === 'my_tickets' && (
              <MyTicketsView
                onBrowseConcerts={() => setCurrentTab('discovery')}
                onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Checkout & Thai QR PromptPay Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Authentication (Login / Register) Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(role) => {
          const effectiveRole = role || userRole;
          if (effectiveRole === 'organizer') {
            setCurrentTab('organizer');
          } else if (effectiveRole === 'gate_staff') {
            setCurrentTab('scanner');
          } else if (activeConcertId && effectiveRole === 'customer') {
            setCurrentTab('seat_map');
          } else {
            setCurrentTab('discovery');
          }
        }}
      />

      {/* Role Switcher & Audit Logs Modal */}
      <RoleAndAuditModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSelectRoleTab={(tab) => setCurrentTab(tab)}
      />

      {/* Supabase & Database SQL Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Minimalist Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ConcertPassProvider>
      <AppContent />
    </ConcertPassProvider>
  );
}
