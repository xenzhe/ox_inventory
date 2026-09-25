import { onUse } from '../../dnd/onUse';
import { onGive } from '../../dnd/onGive';
import { onDrop } from '../../dnd/onDrop';
import { Items } from '../../store/items';
import { fetchNui } from '../../utils/fetchNui';
import { Locale, t } from '../../store/locale';
import { getItemLabel, isSlotWithItem } from '../../helpers';
import { setClipboard } from '../../utils/setClipboard';
import { useAppSelector } from '../../store';
import React, { useEffect, useState } from 'react';
import { Menu, MenuItem } from '../utils/menu/Menu';
import AmountInput from '../utils/AmountInput';

interface DataProps {
  action: string;
  component?: string;
  slot?: number;
  serial?: string;
  id?: number;
}

interface Button {
  label: string;
  index: number;
  group?: string;
}

interface Group {
  groupName: string | null;
  buttons: ButtonWithIndex[];
}

interface ButtonWithIndex extends Button {
  index: number;
}

interface GroupedButtons extends Array<Group> {}

const groundTypes = ['drop', 'newdrop'];
const lockedTypes = ['shop', 'crafting'];

const InventoryContext: React.FC = () => {
  const contextMenu = useAppSelector((state) => state.contextMenu);
  const itemAmount = useAppSelector((state) => state.inventory.itemAmount);
  const leftItems = useAppSelector((state) => state.inventory.leftInventory.items);
  const rightInventory = useAppSelector((state) => state.inventory.rightInventory);
  const item = contextMenu.item;
  const total = item?.count || 1;
  const [amount, setAmount] = useState(total);

  useEffect(() => {
    if (!contextMenu.coords || !item) return;
    setAmount(itemAmount > 0 && itemAmount <= item.count ? itemAmount : item.count);
  }, [contextMenu.coords]);

  const count = Math.max(1, Math.min(amount || total, total));
  const emptySlot = leftItems.find((slot) => slot.name === undefined);
  const rightIsGround = groundTypes.includes(rightInventory.type);
  const canMove = rightInventory.id !== '' && !rightIsGround && !lockedTypes.includes(rightInventory.type);
  const rightTitle = Locale[`ui_inv_${rightInventory.type}`] ?? rightInventory.label ?? '';

  const handleClick = (data: DataProps) => {
    if (!item) return;

    switch (data && data.action) {
      case 'use':
        onUse({ name: item.name, slot: item.slot });
        break;
      case 'give':
        onGive({ name: item.name, slot: item.slot }, count);
        break;
      case 'drop':
        isSlotWithItem(item) && onDrop({ item: item, inventory: 'player' }, undefined, count);
        break;
      case 'split':
        emptySlot &&
          onDrop({ item: item, inventory: 'player' }, { inventory: 'player', item: { slot: emptySlot.slot } }, count);
        break;
      case 'remove':
        fetchNui('removeComponent', { component: data?.component, slot: data?.slot });
        break;
      case 'removeAmmo':
        fetchNui('removeAmmo', item.slot);
        break;
      case 'copy':
        setClipboard(data.serial || '');
        break;
      case 'custom':
        fetchNui('useButton', { id: (data?.id || 0) + 1, slot: item.slot });
        break;
    }
  };

  const groupButtons = (buttons: any): GroupedButtons => {
    return buttons.reduce((groups: Group[], button: Button, index: number) => {
      if (button.group) {
        const groupIndex = groups.findIndex((group) => group.groupName === button.group);
        if (groupIndex !== -1) {
          groups[groupIndex].buttons.push({ ...button, index });
        } else {
          groups.push({
            groupName: button.group,
            buttons: [{ ...button, index }],
          });
        }
      } else {
        groups.push({
          groupName: null,
          buttons: [{ ...button, index }],
        });
      }
      return groups;
    }, []);
  };

  const stack = total > 1;

  return (
    <>
      <Menu>
        {item && (
          <div className="context-menu-header">
            <div className="context-menu-title">
              <span>{getItemLabel(item)}</span>
              {stack && (
                <em>
                  {count.toLocaleString('en-US')} / {total.toLocaleString('en-US')}
                </em>
              )}
            </div>
            {stack && (
              <div className="context-menu-amount">
                <AmountInput value={count} max={total} onChange={(value) => setAmount(value || 1)} />
                <button
                  type="button"
                  className={count === Math.floor(total / 2) ? 'chip is-active' : 'chip'}
                  onClick={() => setAmount(Math.max(1, Math.floor(total / 2)))}
                >
                  ½
                </button>
                <button
                  type="button"
                  className={count === total ? 'chip is-active' : 'chip'}
                  onClick={() => setAmount(total)}
                >
                  {t('ui_all')}
                </button>
              </div>
            )}
          </div>
        )}
        <MenuItem icon="hand" onClick={() => handleClick({ action: 'use' })} label={t('ui_use')} />
        <MenuItem
          icon="send"
          onClick={() => handleClick({ action: 'give' })}
          label={t('ui_give')}
          meta={stack ? `×${count}` : undefined}
        />
        {stack && (
          <MenuItem
            icon="split"
            disabled={!emptySlot || count >= total}
            onClick={() => handleClick({ action: 'split' })}
            label={t('ui_split')}
            meta={`${count} · ${total - count}`}
          />
        )}
        {canMove && (
          <MenuItem
            icon="move"
            onClick={() => handleClick({ action: 'drop' })}
            label={t('ui_move_to', rightTitle)}
            meta={stack ? `×${count}` : undefined}
          />
        )}
        {item && item.metadata?.ammo > 0 && (
          <MenuItem icon="unplug" onClick={() => handleClick({ action: 'removeAmmo' })} label={t('ui_remove_ammo')} />
        )}
        {item && item.metadata?.serial && (
          <MenuItem
            icon="copy"
            onClick={() => handleClick({ action: 'copy', serial: item.metadata?.serial })}
            label={t('ui_copy')}
          />
        )}
        {item && item.metadata?.components && item.metadata?.components.length > 0 && (
          <Menu label={t('ui_removeattachments')} icon="bolt">
            {item &&
              item.metadata?.components.map((component: string, index: number) => (
                <MenuItem
                  key={index}
                  onClick={() => handleClick({ action: 'remove', component, slot: item.slot })}
                  label={Items[component]?.label || component}
                />
              ))}
          </Menu>
        )}
        {((item && item.name && Items[item.name]?.buttons?.length) || 0) > 0 && (
          <>
            {item &&
              item.name &&
              groupButtons(Items[item.name]?.buttons).map((group: Group, index: number) => (
                <React.Fragment key={index}>
                  {group.groupName ? (
                    <Menu label={group.groupName}>
                      {group.buttons.map((button: Button) => (
                        <MenuItem
                          key={button.index}
                          onClick={() => handleClick({ action: 'custom', id: button.index })}
                          label={button.label}
                        />
                      ))}
                    </Menu>
                  ) : (
                    group.buttons.map((button: Button) => (
                      <MenuItem
                        key={button.index}
                        onClick={() => handleClick({ action: 'custom', id: button.index })}
                        label={button.label}
                      />
                    ))
                  )}
                </React.Fragment>
              ))}
          </>
        )}
        {rightIsGround && (
          <>
            <hr className="context-menu-divider" />
            <MenuItem
              icon="trash"
              danger
              onClick={() => handleClick({ action: 'drop' })}
              label={t('ui_drop')}
              meta={stack ? `×${count}` : undefined}
            />
          </>
        )}
      </Menu>
    </>
  );
};

export default InventoryContext;
