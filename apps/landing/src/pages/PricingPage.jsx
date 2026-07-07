import Navbar from '../components/Navbar';
import PricingDetails from '../components/PricingDetails';
import Footer from '../components/Footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#02040a] font-sans antialiased">
      <Navbar />
      <main className="pt-20">
        <PricingDetails />
      </main>
      <Footer />
    </div>
  );
}
