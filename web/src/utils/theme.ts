export const applyAccent = (hex?: string) => {
  const match = hex && /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return;

  const [r, g, b] = match.slice(1).map((channel) => parseInt(channel, 16));
  document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`);
};
