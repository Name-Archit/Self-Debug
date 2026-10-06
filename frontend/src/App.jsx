import Header from './components/Header';
import Hero from './components/Hero';
import DashboardPreview from './components/DashboardPreview';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Header />
      <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen relative">
        <Hero />
        <DashboardPreview />
      </main>
      <Footer />
    </>
  );
}
