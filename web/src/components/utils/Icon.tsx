import React from 'react';

const paths: Record<string, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  car: (
    <>
      <path d="M5 17h14M3 13l2-6h14l2 6v5H3z" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
    </>
  ),
  glovebox: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 11h18M10 15h4" />
    </>
  ),
  package: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </>
  ),
  archive: (
    <>
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
    </>
  ),
  store: (
    <>
      <path d="M3 9 4.5 4h15L21 9M3 9v11h18V9M3 9h18" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  hammer: (
    <>
      <path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
      <path d="M17.64 15 22 10.64M20.91 11.7l-1.25-1.25a2 2 0 0 1-.58-1.41V7.86l-2.8-2.8a5 5 0 0 0-3.5-1.47H9.71l.92.82a6.18 6.18 0 0 1 2.06 4.6V10l2 2h2.17a2 2 0 0 1 1.42.59l1.24 1.24" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  trash: <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />,
  hand: (
    <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 10V4a1.5 1.5 0 0 1 3 0v6M15 10V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L7 14V8a1.5 1.5 0 0 1 3 0v3" />
  ),
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  split: <path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M12 22v-8" />,
  move: <path d="M5 12h14M13 6l6 6-6 6" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />,
  unplug: (
    <path d="m19 5 3-3M2 22l3-3M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4ZM7.5 13.5 10 11M10.5 16.5 13 14M12 6l6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z" />
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  shift: <path d="M9 18v-6H5l7-7 7 7h-4v6z" />,
};

export type IconName = keyof typeof paths;

const Icon: React.FC<{ name: IconName; className?: string }> = ({ name, className }) => (
  <svg
    className={className ? `icon ${className}` : 'icon'}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {paths[name]}
  </svg>
);

export type MouseAction = 'left' | 'right' | 'wheel' | 'drag';

export const Mouse: React.FC<{ action: MouseAction }> = ({ action }) => (
  <svg className="mouse" viewBox="0 0 16 22" aria-hidden>
    {(action === 'left' || action === 'drag') && (
      <path className="mouse-on" d="M7.4 1.7A6.2 6.2 0 0 0 1.7 8v1.3h5.7z" />
    )}
    {action === 'right' && <path className="mouse-on" d="M8.6 1.7A6.2 6.2 0 0 1 14.3 8v1.3H8.6z" />}
    {action === 'wheel' && <rect className="mouse-on" x="6.6" y="3.4" width="2.8" height="4.6" rx="1.4" />}
    <rect className="mouse-line" x="1" y="1" width="14" height="20" rx="7" />
    <path className="mouse-line" d={action === 'wheel' ? 'M1 9.6h14' : 'M8 1v8.6M1 9.6h14'} />
    {action === 'drag' && <path className="mouse-line" d="M5 14.5h6M9 12.5l2 2-2 2" />}
  </svg>
);

export const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => <kbd className="key">{children}</kbd>;

export const Hint: React.FC<{ keys?: React.ReactNode; mouse?: MouseAction; label: string }> = ({
  keys,
  mouse,
  label,
}) => (
  <span className="hint">
    {keys}
    {keys && mouse && <span className="hint-plus">+</span>}
    {mouse && <Mouse action={mouse} />}
    <span>{label}</span>
  </span>
);

export default Icon;
