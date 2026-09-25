import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { store } from '../store';
import { Items } from '../store/items';
import { Locale } from '../store/locale';
import { setDevHandler } from '../utils/fetchNui';
import { applyAccent } from '../utils/theme';
import { isSlotWithItem } from '../helpers';
import { itemDefs, player, scenarios } from './data';
import { devHandler, LogEntry, onLog, send, settings, syncItemCounts } from './nui';
import './dev.scss';

const localeFiles = import.meta.glob<string>('../../../locales/{en,es}.json', { query: '?raw', import: 'default' });

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(`oxdev:${key}`);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(`oxdev:${key}`, value);
    } catch {}
  },
};

const loadLocale = async (lang: string) => {
  const raw = await localeFiles[`../../../locales/${lang}.json`]();
  const strings: Record<string, string> = JSON.parse(raw.replace(/,(\s*})/g, '$1'));
  for (const key in Locale) delete Locale[key];
  Object.assign(Locale, strings);
};

const loadItems = () => {
  for (const [name, def] of Object.entries(itemDefs))
    Items[name] = {
      name,
      label: def.label,
      stack: def.stack ?? true,
      close: def.close ?? false,
      usable: !!(def.consume || def.weapon),
      count: 0,
      description: def.description,
      rarity: def.rarity,
      ammoName: def.ammoName,
      buttons: def.buttons as any,
    };
};

const loadScenario = (id: string) => {
  const scenario = scenarios.find((s) => s.id === id) ?? scenarios[0];
  send('setupInventory', {
    leftInventory: {
      id: 'player-14',
      type: 'player',
      slots: 50,
      label: 'Marcus Vega · 14',
      maxWeight: scenario.playerMaxWeight ?? 30000,
      groups: scenario.groups,
      items: (scenario.player ?? player)(),
    },
    rightInventory: scenario.right(),
  });
  syncItemCounts();
  rerender();
};

const rerender = () => {
  const { leftInventory, rightInventory } = store.getState().inventory;
  send('setupInventory', { leftInventory: { ...leftInventory }, rightInventory: { ...rightInventory } });
};

const accents = ['#c1121f', '#3b82f6', '#10b981', '#e0a943', '#9d6fe0'];

const DevTools: React.FC = () => {
  const [open, setOpen] = useState(storage.get('open') !== '0');
  const [scenario, setScenario] = useState(storage.get('scenario') ?? 'trunk');
  const [lang, setLang] = useState(storage.get('lang') ?? 'es');
  const [accent, setAccent] = useState(storage.get('accent') ?? '#c1121f');
  const [reject, setReject] = useState(false);
  const [slow, setSlow] = useState(false);
  const [visible, setVisible] = useState(true);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    const unsubscribe = onLog((entries) => {
      setLog(entries);
      setReject(settings.rejectNext);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.action === 'closeInventory') setVisible(false);
      if (event.data?.action === 'setupInventory') setVisible(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const pickScenario = (id: string) => {
    setScenario(id);
    storage.set('scenario', id);
    loadScenario(id);
  };

  const pickLang = async (value: string) => {
    setLang(value);
    storage.set('lang', value);
    await loadLocale(value);
    rerender();
  };

  const pickAccent = (value: string) => {
    setAccent(value);
    storage.set('accent', value);
    applyAccent(value);
  };

  const firstItem = () => store.getState().inventory.leftInventory.items.find((item) => isSlotWithItem(item));

  const notify = (text: string, count?: number) => {
    const item = firstItem();
    if (item) send('itemNotify', count ? [item, text, count] : [item, text]);
  };

  const spoilFood = () => {
    const { leftInventory } = store.getState().inventory;
    const now = Math.floor(Date.now() / 1000);
    send('refreshSlots', {
      items: leftInventory.items
        .filter((item) => item.metadata?.degrade)
        .map((item) => ({
          item: { ...item, metadata: { ...item.metadata, durability: now - 60 } },
          inventory: 'player',
        })),
    });
  };

  const current = scenarios.find((s) => s.id === scenario);

  if (!open)
    return (
      <button type="button" className="devtools-toggle" onClick={() => (setOpen(true), storage.set('open', '1'))}>
        dev
      </button>
    );

  return (
    <aside className="devtools">
      <header>
        <b>ox_inventory · dev</b>
        <button type="button" onClick={() => (setOpen(false), storage.set('open', '0'))}>
          ocultar
        </button>
      </header>

      <section>
        <h4>Escenario</h4>
        <div className="devtools-grid">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === scenario ? 'is-on' : ''}
              onClick={() => pickScenario(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        {current && <p>{current.hint}</p>}
      </section>

      <section className="devtools-row">
        <h4>Idioma</h4>
        {['es', 'en'].map((value) => (
          <button key={value} type="button" className={lang === value ? 'is-on' : ''} onClick={() => pickLang(value)}>
            {value}
          </button>
        ))}
      </section>

      <section className="devtools-row">
        <h4>Acento</h4>
        {accents.map((value) => (
          <button
            key={value}
            type="button"
            className={`devtools-swatch ${accent === value ? 'is-on' : ''}`}
            style={{ background: value }}
            onClick={() => pickAccent(value)}
            aria-label={value}
          />
        ))}
        <input type="color" value={accent} onChange={(event) => pickAccent(event.target.value)} />
      </section>

      <section>
        <h4>Servidor simulado</h4>
        <label>
          <input
            type="checkbox"
            checked={reject}
            onChange={(event) => {
              settings.rejectNext = event.target.checked;
              setReject(event.target.checked);
            }}
          />
          Rechazar el próximo movimiento
        </label>
        <label>
          <input
            type="checkbox"
            checked={slow}
            onChange={(event) => {
              settings.latency = event.target.checked ? 1200 : 120;
              setSlow(event.target.checked);
            }}
          />
          Latencia alta (1.2 s)
        </label>
      </section>

      <section>
        <h4>Eventos</h4>
        <div className="devtools-grid">
          <button type="button" onClick={() => notify('ui_added', 3)}>
            + añadido
          </button>
          <button type="button" onClick={() => notify('ui_removed', 250)}>
            − quitado
          </button>
          <button type="button" onClick={() => notify('ui_equipped')}>
            equipado
          </button>
          <button type="button" onClick={() => send('toggleHotbar')}>
            hotbar
          </button>
          <button type="button" onClick={spoilFood}>
            pudrir comida
          </button>
          <button type="button" onClick={() => (visible ? send('closeInventory') : loadScenario(scenario))}>
            {visible ? 'cerrar' : 'abrir'}
          </button>
        </div>
      </section>

      <section>
        <h4>Callbacks NUI</h4>
        <ol className="devtools-log">
          {log.length === 0 && <li className="is-empty">Arrastra, usa o da algo para ver las llamadas.</li>}
          {log.map((entry, index) => (
            <li key={index} className={entry.result === 'false' || entry.result === '"SIN HANDLER"' ? 'is-bad' : ''}>
              <span>{entry.time}</span>
              <b>{entry.event}</b>
              <code title={entry.data}>{entry.data}</code>
              <em>{entry.result}</em>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
};

export const mountDevTools = async () => {
  setDevHandler(devHandler);
  loadItems();
  await loadLocale(storage.get('lang') ?? 'es');
  applyAccent(storage.get('accent') ?? undefined);

  const host = document.createElement('div');
  host.id = 'devtools';
  document.body.appendChild(host);
  createRoot(host).render(<DevTools />);

  setTimeout(() => loadScenario(storage.get('scenario') ?? 'trunk'), 300);
};
