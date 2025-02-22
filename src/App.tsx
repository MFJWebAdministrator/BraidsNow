import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/Home';
import { FAQsPage } from '@/pages/FAQs';
import { BusinessToolsPage } from '@/pages/BusinessTools';
import { SuccessStoriesPage } from '@/pages/SuccessStories';
import { TermsAndConditionsPage } from '@/pages/TermsAndConditions';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicy';
import { ClientCommunityPage } from '@/pages/ClientCommunity';
import { StylistCommunityPage } from '@/pages/StylistCommunity';
import { ClientRegistrationSuccessPage } from '@/pages/ClientRegistrationSuccess';
import { StylistRegistrationSuccessPage } from '@/pages/StylistRegistrationSuccess';
import { ClientDashboardPage } from '@/pages/dashboard/ClientDashboard';
import { ClientSettingsPage } from '@/pages/dashboard/ClientDashboard/Settings';
import { ClientFavoritesPage } from '@/pages/dashboard/ClientDashboard/Favorites';
import { MessagesPage } from '@/pages/dashboard/ClientDashboard/Messages';
import { StyleBoardPage } from '@/pages/dashboard/StyleBoard';
import { StylistDashboardPage } from '@/pages/dashboard/StylistDashboard';
import { StylistSettingsPage } from '@/pages/dashboard/StylistDashboard/Settings';
import { StylistServicesPage } from '@/pages/dashboard/StylistDashboard/Services';
import { StylistSchedulePage } from '@/pages/dashboard/StylistDashboard/Schedule';
import { StylistFavoritesPage } from '@/pages/dashboard/StylistDashboard/Favorites';
import { StylistMessagesPage } from '@/pages/dashboard/StylistDashboard/Messages';
import { StylistPaymentsPage } from '@/pages/dashboard/StylistDashboard/Payments';
import { StylistProfilePage } from '@/pages/StylistProfile';
import { FindStylistsPage } from '@/pages/FindStylists';
import { LoginPage } from '@/pages/Login';
import { StyleShowPage } from '@/pages/StyleShow';
import { BookingPage } from '@/pages/Booking';
import { ScrollToTop } from '@/components/ScrollToTop';

export function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<><Header /><HomePage /><Footer /></>} />
          <Route path="/faqs" element={<><Header /><FAQsPage /><Footer /></>} />
          <Route path="/find-stylists" element={<FindStylistsPage />} />
          <Route path="/stylist/:stylistId" element={<StylistProfilePage />} />
          <Route path="/book/:stylistId" element={<BookingPage />} />
          <Route path="/business-tools" element={<><Header /><BusinessToolsPage /><Footer /></>} />
          <Route path="/success-stories" element={<><Header /><SuccessStoriesPage /><Footer /></>} />
          <Route path="/terms" element={<><Header /><TermsAndConditionsPage /><Footer /></>} />
          <Route path="/privacy" element={<><Header /><PrivacyPolicyPage /><Footer /></>} />
          <Route path="/client-community" element={<><Header /><ClientCommunityPage /><Footer /></>} />
          <Route path="/stylist-community" element={<><Header /><StylistCommunityPage /><Footer /></>} />
          <Route path="/registration-success" element={<ClientRegistrationSuccessPage />} />
          <Route path="/stylist-registration-success" element={<StylistRegistrationSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/style-show" element={<StyleShowPage />} />

          {/* Protected routes */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute>
              <ClientDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/settings" element={
            <ProtectedRoute>
              <ClientSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/favorites" element={
            <ProtectedRoute>
              <ClientFavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/client/styleboard" element={
            <ProtectedRoute>
              <StyleBoardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist" element={
            <ProtectedRoute>
              <StylistDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/messages" element={
            <ProtectedRoute>
              <StylistMessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/settings" element={
            <ProtectedRoute>
              <StylistSettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/services" element={
            <ProtectedRoute>
              <StylistServicesPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/schedule" element={
            <ProtectedRoute>
              <StylistSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/favorites" element={
            <ProtectedRoute>
              <StylistFavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/payments" element={
            <ProtectedRoute>
              <StylistPaymentsPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/stylist/styleboard" element={
            <ProtectedRoute>
              <StyleBoardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}