import { store } from '../store';
import { Items } from '../store/items';
import { Inventory, Slot, SlotWithItem } from '../typings';
import { isSlotWithItem } from '../helpers';
import { itemDefs } from './data';

export const send = (action: string, data?: unknown) =>
  window.dispatchEvent(new MessageEvent('message', { data: { action, data } }));

export const settings = { rejectNext: false, latency: 120 };

export const worldPeds = [
  { key: 'npc', x: 0.875, top: 0.3, bottom: 0.82, npc: true },
  { key: 'p:27', x: 0.205, top: 0.46, bottom: 0.7, reason: 'far' },
];

export type LogEntry = { time: string; event: string; data: string; result: string };
const logListeners = new Set<(log: LogEntry[]) => void>();
let log: LogEntry[] = [];

export const onLog = (listener: (log: LogEntry[]) => void) => {
  logListeners.add(listener);
  listener(log);
  return () => logListeners.delete(listener);
};

const record = (event: string, data: unknown, result: unknown) => {
  const time = new Date().toLocaleTimeString('es-ES');
  log = [
    { time, event, data: JSON.stringify(data) ?? '', result: JSON.stringify(result) ?? 'undefined' },
    ...log,
  ].slice(0, 12);
  logListeners.forEach((listener) => listener(log));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const left = () => store.getState().inventory.leftInventory;
const right = () => store.getState().inventory.rightInventory;

const weightOf = (name: string, count: number) => (itemDefs[name]?.weight ?? 0) * count;

const update = (inventory: Inventory, slots: Slot[]) =>
  send('refreshSlots', {
    items: slots.map((item) => ({
      item: item.name ? { ...item, weight: weightOf(item.name, item.count ?? 0) } : { slot: item.slot },
      inventory: inventory.type,
    })),
  });

const setCount = (inventory: Inventory, item: SlotWithItem, count: number) =>
  update(inventory, [count > 0 ? { ...item, count } : { slot: item.slot }]);

const addItem = (
  inventory: Inventory,
  name: string,
  count: number,
  metadata?: Record<string, unknown>,
  slot?: number
) => {
  const stack = itemDefs[name]?.stack !== false;
  const existing = stack
    ? inventory.items.find(
        (s) => s.name === name && JSON.stringify(s.metadata ?? {}) === JSON.stringify(metadata ?? {})
      )
    : undefined;
  const target =
    (slot && inventory.items[slot - 1]?.name === undefined && inventory.items[slot - 1]) ||
    existing ||
    inventory.items.find((s) => s.name === undefined);
  if (!target) return false;
  update(inventory, [{ slot: target.slot, name, count: (target.count ?? 0) + count, metadata }]);
  return true;
};

const takeByName = (inventory: Inventory, name: string, count: number) => {
  let remaining = count;
  const changes: Slot[] = [];
  for (const slot of inventory.items) {
    if (remaining <= 0) break;
    if (slot.name !== name || !slot.count) continue;
    const used = Math.min(slot.count, remaining);
    remaining -= used;
    changes.push(slot.count - used > 0 ? { ...slot, count: slot.count - used } : { slot: slot.slot });
  }
  if (remaining > 0) return false;
  update(inventory, changes);
  return true;
};

const countOf = (inventory: Inventory, name: string) =>
  inventory.items.reduce((total, slot) => (slot.name === name ? total + (slot.count ?? 0) : total), 0);

export const syncItemCounts = () => {
  for (const name in Items) if (Items[name]) Items[name]!.count = countOf(left(), name);
};

const equipped = new Set<number>();

const handlers: Record<string, (data: any) => unknown | Promise<unknown>> = {
  uiLoaded: () => true,
  getItemData: (name: string) => Items[name] ?? null,
  exit: () => {
    send('closeInventory');
    return 1;
  },
  useItem: (slot: number) => {
    const item = left().items[slot - 1];
    if (!isSlotWithItem(item)) return 1;
    const def = itemDefs[item.name];
    if (def?.weapon) {
      const on = !equipped.has(slot);
      on ? equipped.add(slot) : equipped.delete(slot);
      send('itemNotify', [item, on ? 'ui_equipped' : 'ui_holstered']);
    } else if (def?.consume) {
      setCount(left(), item, item.count - 1);
      send('itemNotify', [item, 'ui_removed', 1]);
    } else {
      console.warn(`[dev] ${item.name} no es usable en el mock`);
    }
    return 1;
  },
  giveItem: ({ slot, count }: { slot: number; count: number }) => {
    const item = left().items[slot - 1];
    if (!isSlotWithItem(item)) return 1;
    const given = count > 0 ? Math.min(count, item.count) : item.count;
    setCount(left(), item, item.count - given);
    send('itemNotify', [item, 'ui_removed', given]);
    return 1;
  },
  swapItems: async () => {
    await sleep(settings.latency);
    if (settings.rejectNext) {
      settings.rejectNext = false;
      return false;
    }
    syncItemCounts();
    return true;
  },
  buyItem: async ({ fromSlot, toSlot, count }: { fromSlot: number; toSlot: number; count: number }) => {
    await sleep(settings.latency);
    const shopItem = right().items[fromSlot - 1] as SlotWithItem;
    const currency = shopItem.currency || 'money';
    const cost = (shopItem.price ?? 0) * count;
    if (countOf(left(), currency) < cost) {
      console.warn(`[dev] Sin fondos: ${cost} ${currency}`);
      return false;
    }
    if (!addItem(left(), shopItem.name, count, shopItem.metadata, toSlot)) return false;
    await sleep(0);
    takeByName(left(), currency, cost);
    if (shopItem.count !== undefined) update(right(), [{ ...shopItem, count: shopItem.count - count }]);
    send('itemNotify', [{ ...shopItem, count }, 'ui_added', count]);
    return true;
  },
  craftItem: async ({ fromSlot, toSlot, count }: { fromSlot: number; toSlot: number; count: number }) => {
    const recipe = right().items[fromSlot - 1] as SlotWithItem;
    await sleep(recipe.duration ?? 3000);
    for (const [name, amount] of Object.entries(recipe.ingredients ?? {}))
      if (amount >= 1) takeByName(left(), name, amount * count);
    await sleep(0);
    addItem(left(), recipe.name, count, recipe.metadata, toSlot);
    await sleep(0);
    syncItemCounts();
    send('refreshSlots', { items: [] });
    send('itemNotify', [recipe, 'ui_added', count]);
    return true;
  },
  removeAmmo: (slot: number) => {
    const item = left().items[slot - 1] as SlotWithItem;
    const ammo = item.metadata?.ammo ?? 0;
    const ammoName = itemDefs[item.name]?.ammoName;
    update(left(), [{ ...item, metadata: { ...item.metadata, ammo: 0 } }]);
    if (ammoName && ammo > 0) setTimeout(() => addItem(left(), ammoName, ammo));
    return 1;
  },
  removeComponent: ({ component, slot }: { component: string; slot: number }) => {
    const item = left().items[slot - 1] as SlotWithItem;
    const components = (item.metadata?.components ?? []).filter((c: string) => c !== component);
    update(left(), [{ ...item, metadata: { ...item.metadata, components } }]);
    setTimeout(() => addItem(left(), component, 1));
    return 1;
  },
  worldGiveAim: (active: boolean) => {
    send('worldGiveCandidates', active ? worldPeds : []);
    return 1;
  },
  worldGive: async ({ slot, count, target }: { slot: number; count: number; target: string }) => {
    await sleep(settings.latency);
    const item = left().items[slot - 1];
    if (!isSlotWithItem(item) || worldPeds.find((ped) => ped.key === target)?.reason) return false;
    const given = Math.min(count, item.count);
    setCount(left(), item, item.count - given);
    send('itemNotify', [item, 'ui_removed', given]);
    return true;
  },
  useButton: ({ id, slot }: { id: number; slot: number }) => {
    console.info(`[dev] Botón ${id} del slot ${slot}`);
    return 1;
  },
};

export const devHandler = async (event: string, data: unknown) => {
  const handler = handlers[event];
  if (!handler) {
    console.error(`[dev] Callback NUI sin handler en el mock: "${event}"`, data);
    record(event, data, 'SIN HANDLER');
    return undefined;
  }
  const result = await handler(data);
  record(event, data, result);
  return result;
};
