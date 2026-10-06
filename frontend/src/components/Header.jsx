const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AP1WRLtEyemXoQcKyf6akWpBrqCzwkym1vS3C-j7lYeVcwkYANjxnToG8_a9xmVfbt5P-IDUbejYBDS9ORoBVRhLNmYSuAtzsyFk2SHqa3N8wrP2oX0fEuhgzC4UlyzgUsHz7FfRWyR9Wh7olIOp7sMSSC_EAVFGewo6GSOKHoAL2zZt9nnW4QiArV12TM07FAoyW_G_rpqmseeNMsRA-Dimvhnb4w6x4gkUSeAGycm66b3ZReWSffiB9BW2ZP0';

const NAV_LINKS = [
  { label: 'Products', href: '#' },
  { label: 'Infrastructure', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Docs', href: '#' },
];

export default function Header() {
  return (
    <header className="bg-surface/40 backdrop-blur-xl fixed top-0 w-full z-50 shadow-2xl flex justify-between items-center px-4 sm:px-gutter py-4 max-w-container-max mx-auto left-0 right-0">
      <div className="flex items-center gap-3">
        <img alt="NovaCloud Logo" className="h-8 w-8 rounded-md" src={LOGO_URL} />
        <span className="font-display-lg-mobile text-display-lg-mobile font-bold tracking-tighter text-on-surface text-xl sm:text-2xl">
          NovaCloud
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8 font-label-md text-label-md">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            className="text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors px-3 py-2 rounded-lg"
            href={link.href}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="hidden md:block btn-secondary font-label-md text-label-md px-4 py-2 rounded-full text-on-surface">
          Log In
        </button>
        <button className="btn-primary font-label-md text-label-md px-4 sm:px-6 py-2 rounded-full text-white active:scale-95 duration-200">
          Get Started
        </button>
      </div>
    </header>
  );
}
