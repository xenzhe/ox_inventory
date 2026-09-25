import { debugData } from './debugData';
import { isEnvBrowser } from './misc';
import { Items } from '../store/items';
import { Locale } from '../store/locale';

const localeFiles = import.meta.glob<string>('../../../locales/{en,es}.json', { query: '?raw', import: 'default' });

const items: Record<string, { label: string; weight: number; stack?: boolean; rarity?: string; description?: string }> =
  {
    WEAPON_PISTOL: { label: 'Pistol', weight: 1200, stack: false, rarity: 'rare' },
    WEAPON_CARBINERIFLE: { label: 'Carbine Rifle', weight: 3400, stack: false, rarity: 'epic' },
    phone: { label: 'Phone', weight: 190, stack: false, rarity: 'uncommon' },
    radio: { label: 'Radio', weight: 350, stack: false },
    bandage: { label: 'Bandage', weight: 100, description: 'Stops light bleeding.' },
    money: { label: 'Money', weight: 0 },
    black_money: { label: 'Dirty Money', weight: 0 },
    water: { label: 'Water Bottle', weight: 500, description: 'Bottled water. Restores thirst when consumed.' },
    burger: { label: 'Burger', weight: 250 },
    'ammo-9': { label: '9mm Ammunition', weight: 10 },
    lockpick: { label: 'Lockpick', weight: 160, rarity: 'rare' },
    armour: { label: 'Bulletproof Vest', weight: 3000, stack: false, rarity: 'epic' },
    medikit: { label: 'Advanced Medical Kit with Extra Long Name', weight: 1200, rarity: 'legendary' },
    sprunk: { label: 'Sprunk', weight: 350 },
    scrapmetal: { label: 'Scrap Metal', weight: 500 },
    parachute: { label: 'Parachute', weight: 4000, stack: false },
    paperbag: { label: 'Paper Bag', weight: 20, stack: false },
    garbage: { label: 'Garbage', weight: 120 },
    card_id: { label: 'ID Card', weight: 5, stack: false },
    carkey: { label: 'Car Key', weight: 20, stack: false },
    cigarette: { label: 'Cigarette', weight: 5 },
    donut: { label: 'Donut', weight: 90 },
    weed: { label: 'Weed', weight: 20, rarity: 'uncommon' },
    at_suppressor: { label: 'Suppressor', weight: 280, rarity: 'rare' },
  };

const player = [
  {
    slot: 1,
    name: 'WEAPON_PISTOL',
    count: 1,
    metadata: { durability: 86, ammo: 12, serial: 'XZH-4471-KV', components: ['at_suppressor'] },
  },
  { slot: 2, name: 'phone', count: 1 },
  { slot: 3, name: 'radio', count: 1 },
  { slot: 4, name: 'bandage', count: 6 },
  { slot: 6, name: 'money', count: 184250 },
  { slot: 7, name: 'water', count: 3, metadata: { durability: 72 } },
  { slot: 8, name: 'burger', count: 2 },
  { slot: 9, name: 'ammo-9', count: 48 },
  { slot: 10, name: 'lockpick', count: 2, metadata: { durability: 44 } },
  { slot: 11, name: 'medikit', count: 1 },
  { slot: 12, name: 'sprunk', count: 5 },
  { slot: 13, name: 'black_money', count: 999999 },
  { slot: 15, name: 'armour', count: 1, metadata: { durability: 18 } },
  { slot: 17, name: 'card_id', count: 1, metadata: { label: 'Marcus Vega' } },
  { slot: 18, name: 'carkey', count: 1 },
  { slot: 21, name: 'cigarette', count: 20 },
  { slot: 24, name: 'donut', count: 12 },
  { slot: 29, name: 'weed', count: 150 },
  { slot: 41, name: 'WEAPON_CARBINERIFLE', count: 1, metadata: { durability: 100, ammo: 30 } },
];

const trunk = [
  { slot: 1, name: 'scrapmetal', count: 24 },
  { slot: 2, name: 'black_money', count: 12500 },
  { slot: 3, name: 'parachute', count: 1 },
  { slot: 4, name: 'sprunk', count: 9 },
  { slot: 5, name: 'paperbag', count: 1 },
  { slot: 6, name: 'garbage', count: 3 },
  { slot: 7, name: 'WEAPON_PISTOL', count: 1, metadata: { durability: 100 } },
];

const withWeight = (list: { slot: number; name: string; count: number; metadata?: Record<string, unknown> }[]) =>
  list.map((item) => ({ ...item, weight: items[item.name].weight * item.count }));

export const loadDevData = async () => {
  if (!isEnvBrowser()) return;

  const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  const file = await localeFiles[`../../../locales/${lang}.json`]();
  const strings: Record<string, string> = JSON.parse(file.replace(/,(\s*})/g, '$1'));
  for (const [key, value] of Object.entries(strings)) Locale[key] = value;

  for (const [name, data] of Object.entries(items))
    Items[name] = { name, close: false, usable: true, count: 0, stack: data.stack ?? true, ...data };

  const right = new URLSearchParams(location.search).get('right') || 'trunk';

  debugData([
    {
      action: 'setupInventory',
      data: {
        leftInventory: {
          id: 'player',
          type: 'player',
          slots: 50,
          label: 'Marcus Vega',
          maxWeight: 30000,
          items: withWeight(player),
        },
        rightInventory:
          right === 'shop'
            ? {
                id: 'shop',
                type: 'shop',
                slots: 8,
                label: '24/7',
                items: [
                  { slot: 1, name: 'water', weight: 500, price: 15, count: 40 },
                  { slot: 2, name: 'burger', weight: 250, price: 25 },
                  { slot: 3, name: 'bandage', weight: 100, price: 120 },
                  { slot: 4, name: 'phone', weight: 190, price: 850 },
                  { slot: 5, name: 'lockpick', weight: 160, price: 12, currency: 'black_money' },
                ],
              }
            : right === 'ground'
              ? { id: 'newdrop', type: 'newdrop', slots: 30, label: Locale.ui_inv_newdrop, maxWeight: 30000, items: [] }
              : {
                  id: 'trunk',
                  type: 'trunk',
                  slots: 60,
                  label: 'Sultan RS · 46XZH118',
                  maxWeight: 120000,
                  items: withWeight(trunk),
                },
      },
    },
  ]);
};
