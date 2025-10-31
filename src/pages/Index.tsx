import Hero from '@/components/Hero';
import Narrative from '@/components/Narrative';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Hero />
      <Narrative />
      <Footer />
    </main>
  );
};

export default Index;
