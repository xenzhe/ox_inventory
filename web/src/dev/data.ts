import type { Inventory, Slot } from '../typings';

type ItemDef = {
  label: string;
  weight: number;
  stack?: boolean;
  close?: boolean;
  rarity?: string;
  description?: string;
  ammoName?: string;
  buttons?: { label: string; group?: string }[];
  consume?: boolean;
  weapon?: boolean;
};

export const itemDefs: Record<string, ItemDef> = {
  money: { label: 'Dinero', weight: 0 },
  black_money: { label: 'Dinero negro', weight: 0, description: 'Billetes marcados. Cuidado con la policía.' },
  card_id: { label: 'Documento de identidad', weight: 5, stack: false },
  card_bank: { label: 'Tarjeta Maze Bank', weight: 5, stack: false, rarity: 'uncommon' },
  phone: { label: 'Teléfono', weight: 190, stack: false, rarity: 'uncommon' },
  radio: {
    label: 'Radio',
    weight: 350,
    stack: false,
    buttons: [{ label: 'Canal 1' }, { label: 'Canal 2' }, { label: 'Apagar', group: 'Ajustes' }],
  },
  carkey: { label: 'Llave de vehículo', weight: 20, stack: false },
  oldkey: {
    label: 'Llave oxidada del puerto',
    weight: 15,
    stack: false,
    rarity: 'legendary',
    description: 'Nadie recuerda qué abre.',
  },
  usb_black: {
    label: 'USB encriptado',
    weight: 10,
    stack: false,
    rarity: 'epic',
    description: '**Contenido cifrado.** Un hacker podría abrirlo.',
  },

  water: { label: 'Botella de agua', weight: 500, consume: true, description: 'Agua embotellada. Quita la sed.' },
  sprunk: { label: 'Sprunk', weight: 350, consume: true },
  burger: { label: 'Hamburguesa', weight: 250, consume: true },
  burger_chicken: { label: 'Hamburguesa de pollo', weight: 260, consume: true },
  pizza_ham_slice: { label: 'Porción de pizza', weight: 120, consume: true },
  donut: { label: 'Dónut', weight: 90, consume: true },
  fries: { label: 'Patatas fritas', weight: 150, consume: true },
  cigarette: { label: 'Cigarrillo', weight: 5, consume: true },

  bandage: { label: 'Venda', weight: 100, consume: true, description: 'Detiene sangrados leves.' },
  medikit: { label: 'Botiquín de trauma avanzado', weight: 1200, rarity: 'rare', consume: true },
  armour: { label: 'Chaleco antibalas', weight: 3000, stack: false, rarity: 'epic', consume: true },

  lockpick: { label: 'Ganzúa', weight: 160, rarity: 'rare', consume: true },
  advancedkit: { label: 'Kit de reparación avanzado', weight: 2500, rarity: 'rare' },
  scrapmetal: { label: 'Chatarra', weight: 500 },
  garbage: { label: 'Basura', weight: 120 },
  paperbag: { label: 'Bolsa de papel', weight: 20, stack: false },
  parachute: { label: 'Paracaídas', weight: 4000, stack: false },
  ziptie: { label: 'Bridas', weight: 10 },
  weed: { label: 'Cogollo de marihuana', weight: 20, rarity: 'uncommon' },
  cocaine: { label: 'Bolsita de cocaína', weight: 15, rarity: 'rare' },
  meth: { label: 'Cristal', weight: 15, rarity: 'rare' },

  'ammo-9': { label: 'Munición 9mm', weight: 10 },
  'ammo-rifle': { label: 'Munición 5.56', weight: 15 },
  at_suppressor: { label: 'Supresor', weight: 280, rarity: 'rare' },
  at_flashlight: { label: 'Linterna táctica', weight: 120 },
  at_scope_holo: { label: 'Mira holográfica', weight: 180, rarity: 'uncommon' },
  WEAPON_PISTOL: { label: 'Pistola', weight: 1200, stack: false, rarity: 'common', weapon: true, ammoName: 'ammo-9' },
  WEAPON_COMBATPISTOL: {
    label: 'Pistola de combate',
    weight: 1100,
    stack: false,
    rarity: 'common',
    weapon: true,
    ammoName: 'ammo-9',
  },
  WEAPON_CARBINERIFLE: {
    label: 'Carabina',
    weight: 3400,
    stack: false,
    rarity: 'rare',
    weapon: true,
    ammoName: 'ammo-rifle',
  },
  WEAPON_MICROSMG: {
    label: 'Micro SMG',
    weight: 2500,
    stack: false,
    rarity: 'uncommon',
    weapon: true,
    ammoName: 'ammo-9',
  },
  WEAPON_SMG: { label: 'SMG', weight: 3000, stack: false, rarity: 'rare', weapon: true, ammoName: 'ammo-9' },
  WEAPON_SPECIALCARBINE_MK2: {
    label: 'Carabina especial Mk II',
    weight: 3600,
    stack: false,
    rarity: 'epic',
    weapon: true,
    ammoName: 'ammo-rifle',
  },
  WEAPON_HEAVYSNIPER: { label: 'Francotirador pesado', weight: 8000, stack: false, rarity: 'legendary', weapon: true },
  WEAPON_KNIFE: { label: 'Cuchillo', weight: 400, stack: false, weapon: true },
  WEAPON_CROWBAR: { label: 'Palanca', weight: 1800, stack: false, weapon: true },
  WEAPON_FLASHLIGHT: { label: 'Linterna', weight: 600, stack: false, weapon: true },
  WEAPON_PETROLCAN: { label: 'Bidón de gasolina', weight: 4000, stack: false, weapon: true },
};

export type DevSlot = Slot & {
  name: string;
  count: number;
  price?: number;
  currency?: string;
  grade?: number;
  ingredients?: Record<string, number>;
  duration?: number;
};

const now = () => Math.floor(Date.now() / 1000);
const fresh = (minutes: number, degrade: number) => ({ durability: now() + minutes * 60, degrade });

const withWeight = (items: DevSlot[]) =>
  items.map((item) => ({ ...item, weight: item.weight ?? (itemDefs[item.name]?.weight ?? 0) * item.count }));

export const player = (): DevSlot[] =>
  withWeight([
    {
      slot: 1,
      name: 'WEAPON_PISTOL',
      count: 1,
      metadata: {
        durability: 86,
        ammo: 12,
        serial: 'XZH4471KV',
        components: ['at_suppressor', 'at_flashlight'],
        weapontint: 'Oro',
      },
    },
    { slot: 2, name: 'phone', count: 1, metadata: { phoneNumber: '555-0142' } },
    { slot: 3, name: 'radio', count: 1 },
    { slot: 4, name: 'bandage', count: 6 },
    { slot: 6, name: 'money', count: 184250 },
    { slot: 7, name: 'water', count: 3, metadata: fresh(40, 60) },
    { slot: 8, name: 'burger', count: 2, metadata: fresh(6, 30) },
    { slot: 9, name: 'ammo-9', count: 48 },
    { slot: 10, name: 'lockpick', count: 2, metadata: { durability: 44 } },
    { slot: 11, name: 'medikit', count: 1 },
    { slot: 12, name: 'sprunk', count: 5 },
    { slot: 13, name: 'black_money', count: 999999 },
    { slot: 15, name: 'armour', count: 1, metadata: { durability: 18 } },
    {
      slot: 16,
      name: 'card_id',
      count: 1,
      metadata: {
        label: 'DNI · Marcus Vega',
        description: 'Nacido el 14/03/1994  \nCiudadano: **XZH-20831**',
        citizenid: 'XZH-20831',
      },
    },
    { slot: 17, name: 'carkey', count: 1, metadata: { label: 'Llave · 46XZH118', plate: '46XZH118' } },
    { slot: 18, name: 'usb_black', count: 1 },
    { slot: 19, name: 'WEAPON_MICROSMG', count: 1, metadata: { durability: 91, ammo: 20, serial: 'MK-2231-DX' } },
    { slot: 20, name: 'WEAPON_SMG', count: 1, metadata: { durability: 64, ammo: 30, serial: 'SMG-00481' } },
    { slot: 21, name: 'cigarette', count: 20 },
    { slot: 23, name: 'WEAPON_HEAVYSNIPER', count: 1, metadata: { durability: 100, ammo: 6, serial: 'XZH-LEGEND-01' } },
    {
      slot: 26,
      name: 'WEAPON_SPECIALCARBINE_MK2',
      count: 1,
      metadata: { durability: 77, ammo: 30, serial: 'SC-MK2-7719' },
    },
    { slot: 22, name: 'pizza_ham_slice', count: 1, metadata: fresh(-5, 20) },
    { slot: 24, name: 'donut', count: 12 },
    { slot: 25, name: 'mystery_crate', count: 1, weight: 900 },
    { slot: 29, name: 'weed', count: 150 },
    { slot: 30, name: 'card_bank', count: 1, metadata: { imageurl: 'https://items.rainmad.com/images/card_bank.png' } },
    {
      slot: 41,
      name: 'WEAPON_CARBINERIFLE',
      count: 1,
      metadata: { durability: 100, ammo: 30, serial: 'LSPD-00917', components: ['at_scope_holo'] },
    },
    { slot: 50, name: 'oldkey', count: 1 },
  ]);

export type Scenario = {
  id: string;
  label: string;
  hint: string;
  groups?: Record<string, number>;
  playerMaxWeight?: number;
  player?: () => DevSlot[];
  right: () => Inventory;
};

const fill = (count: number, start = 1): DevSlot[] => {
  const pool = Object.keys(itemDefs).filter((name) => !itemDefs[name].weapon && name !== 'money');
  return Array.from({ length: count }, (_, i) => {
    const name = pool[(i * 7) % pool.length];
    const stack = itemDefs[name].stack !== false;
    return { slot: start + i, name, count: stack ? ((i * 37) % 250) + 1 : 1 };
  });
};

export const scenarios: Scenario[] = [
  {
    id: 'trunk',
    label: 'Maletero',
    hint: 'Caso base: dos inventarios, arrastrar, dividir, mover.',
    right: () => ({
      id: 'trunk-46XZH118',
      type: 'trunk',
      slots: 60,
      label: 'Sultan RS · 46XZH118',
      maxWeight: 120000,
      items: withWeight([
        { slot: 1, name: 'scrapmetal', count: 24 },
        { slot: 2, name: 'black_money', count: 12500 },
        { slot: 3, name: 'parachute', count: 1 },
        { slot: 4, name: 'sprunk', count: 9 },
        {
          slot: 5,
          name: 'paperbag',
          count: 1,
          metadata: { label: 'Bolsa de papel con algo pesado dentro', container: 'bag-1' },
        },
        { slot: 6, name: 'garbage', count: 3 },
        { slot: 7, name: 'WEAPON_PETROLCAN', count: 1, metadata: { durability: 35, ammo: 1200 } },
        { slot: 8, name: 'WEAPON_CROWBAR', count: 1 },
        { slot: 60, name: 'advancedkit', count: 2 },
      ]),
    }),
  },
  {
    id: 'glovebox',
    label: 'Guantera llena',
    hint: 'Peso al 97%: barra roja. Pocas casillas, sin scroll.',
    right: () => ({
      id: 'glove-46XZH118',
      type: 'glovebox',
      slots: 5,
      label: '46XZH118',
      maxWeight: 10000,
      items: withWeight([
        { slot: 1, name: 'WEAPON_COMBATPISTOL', count: 1, metadata: { durability: 62, ammo: 0, serial: 'SCRATCHED' } },
        { slot: 2, name: 'ammo-9', count: 250 },
        { slot: 3, name: 'cocaine', count: 40 },
        { slot: 4, name: 'meth', count: 12 },
        { slot: 5, name: 'WEAPON_PETROLCAN', count: 1, metadata: { durability: 90 } },
      ]),
    }),
  },
  {
    id: 'stash',
    label: 'Almacén enorme',
    hint: '200 casillas: scroll interno, carga por páginas, números largos.',
    right: () => ({
      id: 'stash-warehouse',
      type: 'stash',
      slots: 200,
      label: 'Nave industrial de La Mesa',
      maxWeight: 2000000,
      items: withWeight(fill(170)),
    }),
  },
  {
    id: 'shop',
    label: 'Tienda',
    hint: 'Precios, moneda alternativa, sin stock y objetos bloqueados por rango.',
    groups: { police: 1 },
    right: () => ({
      id: 'shop-247',
      type: 'shop',
      slots: 12,
      label: '24/7 · Grove Street',
      groups: { police: 0 },
      items: [
        { slot: 1, name: 'water', weight: 500, price: 15, count: 40 },
        { slot: 2, name: 'burger_chicken', weight: 260, price: 25 },
        { slot: 3, name: 'fries', weight: 150, price: 8, count: 0 },
        { slot: 4, name: 'bandage', weight: 100, price: 120 },
        { slot: 5, name: 'phone', weight: 190, price: 850 },
        { slot: 6, name: 'lockpick', weight: 160, price: 12, currency: 'black_money' },
        { slot: 7, name: 'ziptie', weight: 10, price: 3, currency: 'scrapmetal' },
        { slot: 8, name: 'WEAPON_COMBATPISTOL', weight: 1100, price: 4500, grade: 3 },
        { slot: 9, name: 'armour', weight: 3000, price: 1250000, grade: 1 },
      ],
    }),
  },
  {
    id: 'crafting',
    label: 'Fabricación',
    hint: 'Recetas que puedes y no puedes hacer, con duración e ingredientes parciales.',
    right: () => ({
      id: 'craft-bench',
      type: 'crafting',
      slots: 6,
      label: 'Banco de trabajo',
      items: [
        { slot: 1, name: 'lockpick', weight: 160, duration: 4000, ingredients: { scrapmetal: 2, WEAPON_CROWBAR: 0.1 } },
        { slot: 2, name: 'advancedkit', weight: 2500, duration: 12000, ingredients: { scrapmetal: 10, ziptie: 4 } },
        { slot: 3, name: 'bandage', weight: 100, duration: 1500, ingredients: { garbage: 1 } },
        { slot: 4, name: 'at_suppressor', weight: 280, duration: 20000, ingredients: { scrapmetal: 25, usb_black: 1 } },
      ],
    }),
    player: () => [
      ...player(),
      ...withWeight([
        { slot: 42, name: 'scrapmetal', count: 6 },
        { slot: 43, name: 'WEAPON_CROWBAR', count: 1, metadata: { durability: 40 } },
        { slot: 44, name: 'garbage', count: 2 },
      ]),
    ],
  },
  {
    id: 'ground',
    label: 'Solo bolsillos',
    hint: 'Sin contenedor: el suelo vacío no se muestra. Arrastra fuera para tirar.',
    right: () => ({ id: 'newdrop', type: 'newdrop', slots: 30, label: '', maxWeight: 30000, items: [] }),
  },
  {
    id: 'pile',
    label: 'Montón en el suelo',
    hint: 'Un drop con objetos cerca: sí se muestra y tirar lo añade a ese montón.',
    right: () => ({
      id: 'drop-8812',
      type: 'drop',
      slots: 30,
      label: 'Drop 8812',
      maxWeight: 30000,
      items: withWeight([
        { slot: 1, name: 'garbage', count: 2 },
        { slot: 2, name: 'WEAPON_KNIFE', count: 1, metadata: { durability: 70 } },
      ]),
    }),
  },
  {
    id: 'frisk',
    label: 'Cacheo',
    hint: 'Otro jugador con nombre largo y objetos sin imagen.',
    right: () => ({
      id: 'player-27',
      type: 'otherplayer',
      slots: 50,
      label: 'Francisco Javier de la Santísima Trinidad · 27',
      maxWeight: 30000,
      items: withWeight([
        { slot: 1, name: 'WEAPON_KNIFE', count: 1 },
        { slot: 2, name: 'money', count: 320 },
        { slot: 3, name: 'unknown_item_xyz', count: 3, weight: 30 },
        { slot: 4, name: 'weed', count: 7 },
      ]),
    }),
  },
  {
    id: 'overweight',
    label: 'Sobrecargado',
    hint: 'Bolsillos por encima del máximo: la barra no debe desbordar.',
    playerMaxWeight: 30000,
    right: () => ({ id: 'newdrop', type: 'newdrop', slots: 30, label: '', maxWeight: 30000, items: [] }),
  },
  {
    id: 'empty',
    label: 'Jugador nuevo',
    hint: 'Bolsillos vacíos: estados vacíos y hotbar sin nada.',
    player: () => [],
    right: () => ({ id: 'newdrop', type: 'newdrop', slots: 30, label: '', maxWeight: 30000, items: [] }),
  },
];
