import React, { useState } from 'react';
import { getRarity, isSlotWithItem } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import SlideUp from '../utils/transitions/SlideUp';
import SlotContent from './SlotContent';

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items.slice(0, 5);

  const [handle, setHandle] = useState<ReturnType<typeof setTimeout>>();
  useNuiEvent('toggleHotbar', () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  return (
    <SlideUp in={hotbarVisible}>
      <div className="hotbar">
        <div className="panel hotbar-panel">
          {items.map((item) => {
            const hasItem = isSlotWithItem(item);
            const rarity = hasItem ? getRarity(item) : undefined;

            return (
              <div
                className={`slot ${hasItem ? 'has-item' : 'is-empty'} ${rarity ? 'has-rarity' : ''}`}
                data-rarity={rarity?.tier}
                style={rarity?.color ? ({ '--rarity': rarity.color } as React.CSSProperties) : undefined}
                key={`hotbar-${item.slot}`}
              >
                {hasItem ? (
                  <SlotContent item={item} inventoryType="player" hotkey={item.slot} />
                ) : (
                  <span className="slot-hotkey">{item.slot}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SlideUp>
  );
};

export default InventoryHotbar;
