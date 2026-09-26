import { store } from '../store';
import { isSlotWithItem } from '../helpers';
import { validateMove } from '../thunks/validateItems';
import { onDrop } from './onDrop';

export const onDropGround = (slot: number, count: number) => {
  const { inventory } = store.getState();
  const item = inventory.leftInventory.items[slot - 1];

  if (!isSlotWithItem(item)) return;

  const amount = Math.max(1, Math.min(count, item.count));

  if (inventory.rightInventory.type === 'drop') {
    const free = inventory.rightInventory.items.find((target) => target.name === undefined);

    if (free) return onDrop({ item, inventory: 'player' }, { inventory: 'drop', item: { slot: free.slot } }, amount);
  }

  store.dispatch(
    validateMove({
      fromSlot: slot,
      fromType: 'player',
      toSlot: 1,
      toType: 'newdrop',
      count: amount,
    })
  );
};
