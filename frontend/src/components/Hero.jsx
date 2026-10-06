import Icon from './Icon';
import FloatingCards from './FloatingCards';

export default function Hero() {
  return (
    <section className="text-center max-w-4xl mx-auto mb-12 md:mb-24 relative z-10">
      <div className="inline-block px-4 py-1 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary font-label-sm text-label-sm mb-6 uppercase tracking-wider">
        Platform 2.0 Now Available
      </div>

      <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-6 primary-gradient-text glow-text leading-tight">
        Build resilient
        <br />
        infrastructure.
        <br />
        Recover instantly.
      </h1>

      <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto px-2">
        Powerful, automated deployment and recovery for modern engineering teams. Trusted by
        leading enterprises to keep their critical systems online.
      </p>

      <div className="relative z-30 pointer-events-auto flex flex-col sm:flex-row justify-center items-center gap-4 px-4 sm:px-0">
        <button type="button" className="btn-primary font-label-md text-label-md px-8 py-4 rounded-full text-white w-full sm:w-auto active:scale-95 transition-transform">
          Start Free Trial
        </button>
        <button type="button" className="btn-secondary font-label-md text-label-md px-8 py-4 rounded-full text-on-surface w-full sm:w-auto flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Icon name="play_circle" size={20} />
          Watch Demo
        </button>
      </div>

      <FloatingCards />
    </section>
  );
}
