import Hero from './components/Hero';
import Features from './components/Features';
import TrustLayer from './components/TrustLayer';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import Pricing from './components/Pricing';

import Footer from './components/Footer';
import AccessModal from './components/AccessModal';

function App() {
  return (
    <div className="antialiased bg-[#02040a] min-h-screen font-sans">
      <Hero />
      <Features />
      <TrustLayer />
      <HowItWorks />
      <FAQ />
      <Pricing />
      
      <Footer />
      <AccessModal />
    </div>
  );
}

export default App;