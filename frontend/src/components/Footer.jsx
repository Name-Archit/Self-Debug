const LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AP1WRLtEyemXoQcKyf6akWpBrqCzwkym1vS3C-j7lYeVcwkYANjxnToG8_a9xmVfbt5P-IDUbejYBDS9ORoBVRhLNmYSuAtzsyFk2SHqa3N8wrP2oX0fEuhgzC4UlyzgUsHz7FfRWyR9Wh7olIOp7sMSSC_EAVFGewo6GSOKHoAL2zZt9nnW4QiArV12TM07FAoyW_G_rpqmseeNMsRA-Dimvhnb4w6x4gkUSeAGycm66b3ZReWSffiB9BW2ZP0';

const FOOTER_LINKS = {
  Product: ['Features', 'Integrations', 'Pricing', 'Changelog'],
  Resources: ['Documentation', 'API Status', 'Blog', 'Community'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Security', 'Support'],
};

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest py-12 border-t border-outline-variant w-full mt-12 md:mt-24 relative z-10">
      <div className="max-w-container-max mx-auto px-4 sm:px-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="font-headline-lg text-headline-lg text-on-surface mb-4 flex items-center gap-2 text-xl">
            <img alt="NovaCloud Logo" className="h-6 w-6 rounded" src={LOGO_URL} />
            NovaCloud
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant mb-6 max-w-xs">
            Building the future of resilient, automated infrastructure for modern engineering teams.
          </p>
          <div className="text-on-surface-variant font-label-sm text-label-sm">
            © 2025 NovaCloud Systems. All rights reserved.
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title} className="flex flex-col gap-3 font-body-md text-body-md">
            <div className="font-bold text-on-surface mb-2">{title}</div>
            {links.map((link) => (
              <a
                key={link}
                href="#"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
