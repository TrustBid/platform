import Hero from '../components/Hero';
import Features from '../components/Features';
import TrustLayer from '../components/TrustLayer';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import Pricing from '../components/Pricing';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <TrustLayer />
      <HowItWorks />
      <FAQ />
      <Pricing />
      <Footer />
    </>
  );
}
