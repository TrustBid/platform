import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import AccessModal from './components/AccessModal';

export default function App() {
  return (
    <div className="min-h-screen bg-[#02040a] font-sans antialiased">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
      <AccessModal />
    </div>
  );
}
