import { store } from '../store';
import { Slot } from '../typings';
import { fetchNui } from '../utils/fetchNui';

export const onGive = (item: Slot, amount?: number) => {
  const {
    inventory: { itemAmount },
  } = store.getState();
  fetchNui('giveItem', { slot: item.slot, count: amount ?? itemAmount });
};
