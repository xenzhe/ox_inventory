import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inventory } from '../../typings';
import InventorySlot from './InventorySlot';
import { formatWeight, getTotalWeight, isSlotWithItem } from '../../helpers';
import { useAppDispatch, useAppSelector } from '../../store';
import { useIntersection } from '../../hooks/useIntersection';
import { selectItemAmount, setItemAmount } from '../../store/inventory';
import { Locale, t } from '../../store/locale';
import Icon, { Hint, IconName, Key } from '../utils/Icon';
import AmountInput from '../utils/AmountInput';
import UsefulControls from './UsefulControls';

const PAGE_SIZE = 30;

const typeIcons: Record<string, IconName> = {
  player: 'user',
  otherplayer: 'user',
  trunk: 'car',
  glovebox: 'glovebox',
  drop: 'package',
  newdrop: 'package',
  stash: 'archive',
  container: 'archive',
  shop: 'store',
  crafting: 'hammer',
  policeevidence: 'shield',
  dumpster: 'trash',
};

const LeftFooter: React.FC = () => {
  const dispatch = useAppDispatch();
  const itemAmount = useAppSelector(selectItemAmount);
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <>
      <Hint mouse="drag" label={t('ui_hint_move')} />
      <Hint
        keys={
          <Key>
            <Icon name="shift" />
          </Key>
        }
        mouse="drag"
        label={t('ui_hint_half')}
      />
      <Hint mouse="right" label={t('ui_hint_options')} />
      <button type="button" className="footer-help" onClick={() => setHelpVisible(true)}>
        <Icon name="help" />
      </button>
      <AmountInput className="footer-amount" value={itemAmount} onChange={(value) => dispatch(setItemAmount(value))} />
      <UsefulControls infoVisible={helpVisible} setInfoVisible={setHelpVisible} />
    </>
  );
};

const RightFooter: React.FC<{ used: number; slots: number }> = ({ used, slots }) => (
  <>
    <span className="footer-slots">{t('ui_slots_used', used, slots)}</span>
    <span className="hint footer-close">
      <Key>{t('ui_key_esc')}</Key>
      <span>{t('ui_close')}</span>
    </span>
    <span className="brand">
      xenzhe<b>_</b>
    </span>
  </>
);

const InventoryGrid: React.FC<{ inventory: Inventory; side: 'left' | 'right' }> = ({ inventory, side }) => {
  const weight = useMemo(
    () => (inventory.maxWeight !== undefined ? Math.floor(getTotalWeight(inventory.items) * 1000) / 1000 : 0),
    [inventory.maxWeight, inventory.items]
  );
  const used = useMemo(() => inventory.items.filter((item) => isSlotWithItem(item)).length, [inventory.items]);
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { ref, entry } = useIntersection({ threshold: 0.5 });
  const isBusy = useAppSelector((state) => state.inventory.isBusy);

  useEffect(() => {
    if (entry && entry.isIntersecting) {
      setPage((prev) => ++prev);
    }
  }, [entry]);

  const percent = inventory.maxWeight ? Math.min(100, (weight / inventory.maxWeight) * 100) : 0;
  const titleKey = `ui_inv_${inventory.type}`;
  const title = Locale[titleKey] ?? inventory.label ?? inventory.type;
  const subtitle =
    Locale[titleKey] !== undefined && inventory.label?.toLowerCase() !== title.toLowerCase() ? inventory.label : undefined;

  return (
    <section className="panel inventory-panel" style={{ pointerEvents: isBusy ? 'none' : 'auto' }}>
      <header className="panel-header">
        <div className="panel-icon">
          <Icon name={typeIcons[inventory.type] ?? 'package'} />
        </div>
        <div className="panel-title">
          <b>{title}</b>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {inventory.maxWeight ? (
          <div className="panel-weight">
            <em>{formatWeight(weight)}</em> / {formatWeight(inventory.maxWeight)} {t('ui_kg')}
          </div>
        ) : null}
      </header>
      <div className={`weight-bar ${percent >= 95 ? 'is-full' : percent >= 80 ? 'is-warn' : ''}`}>
        <i style={{ width: `${percent}%` }} />
      </div>
      <div className="inventory-grid" ref={containerRef}>
        {inventory.items.slice(0, (page + 1) * PAGE_SIZE).map((item, index) => (
          <InventorySlot
            key={`${inventory.type}-${inventory.id}-${item.slot}`}
            item={item}
            ref={index === (page + 1) * PAGE_SIZE - 1 ? ref : null}
            inventoryType={inventory.type}
            inventoryGroups={inventory.groups}
            inventoryId={inventory.id}
          />
        ))}
      </div>
      <footer className="panel-footer">
        {side === 'left' ? <LeftFooter /> : <RightFooter used={used} slots={inventory.slots} />}
      </footer>
    </section>
  );
};

export default InventoryGrid;
