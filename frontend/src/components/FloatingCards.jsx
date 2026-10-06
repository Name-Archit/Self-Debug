import Icon from './Icon';

const MOBILE_CARDS = [
  { icon: 'verified', label: 'Uptime', value: '99.99%', color: 'text-primary', animation: 'animate-float-1' },
  { icon: 'memory', label: 'Active Nodes', value: '48', color: 'text-secondary', animation: 'animate-float-2', offset: true },
  { icon: 'speed', label: 'Latency', value: '142ms', color: 'text-tertiary', animation: 'animate-float-3' },
  { icon: 'auto_awesome', label: 'Recovery', value: '98%', color: 'text-primary-fixed', animation: 'animate-float-2', offset: true },
];

export default function FloatingCards() {
  return (
    <>
      {/* Desktop: floating cards around hero */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
        <div className="glass-card animate-float-1 absolute top-[5%] left-[-10%] xl:left-[-16%] p-4 rounded-xl w-48 rotate-[-5deg] pointer-events-none">
          <div className="font-label-sm text-label-sm text-on-surface-variant mb-1 flex justify-between">
            <span>Uptime</span>
            <Icon name="check_circle" size={16} className="text-primary" />
          </div>
          <div className="font-headline-lg text-headline-lg text-primary">99.99%</div>
          <div className="w-full h-1 bg-surface-container mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>

        <div className="glass-card animate-float-2 absolute top-[75%] left-[-6%] xl:left-[-12%] p-4 rounded-xl w-48 rotate-[3deg] pointer-events-none">
          <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Active Nodes</div>
          <div className="font-headline-lg text-headline-lg text-secondary">48</div>
          <div className="flex gap-1 mt-2 h-4 items-end">
            {[40, 70, 50, 90, 60].map((h, i) => (
              <div
                key={i}
                className="w-full bg-secondary rounded-sm"
                style={{ height: `${h}%`, opacity: 0.3 + i * 0.15 }}
              />
            ))}
          </div>
        </div>

        <div className="glass-card animate-float-3 absolute top-[12%] right-[-8%] xl:right-[-14%] p-4 rounded-xl w-48 rotate-[4deg] pointer-events-none">
          <div className="font-label-sm text-label-sm text-on-surface-variant mb-1">Latency</div>
          <div className="font-headline-lg text-headline-lg text-tertiary">142ms</div>
          <svg className="mt-2" height="20" viewBox="0 0 100 20" width="100%">
            <path
              d="M0,15 Q10,5 20,10 T40,15 T60,5 T80,12 T100,8"
              fill="none"
              stroke="#ffb596"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Mobile & tablet: grid cards */}
      <div className="lg:hidden mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto px-4">
        {MOBILE_CARDS.map((card) => (
          <div
            key={card.label}
            className={`glass-card p-5 rounded-xl ${card.animation} flex flex-col items-center text-center ${
              card.offset ? 'mt-4' : ''
            }`}
          >
            <Icon name={card.icon} size={32} className={`${card.color} mb-2`} />
            <h3 className="font-label-sm text-label-sm text-on-surface-variant uppercase">{card.label}</h3>
            <p className="font-headline-lg text-headline-lg text-on-surface mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
