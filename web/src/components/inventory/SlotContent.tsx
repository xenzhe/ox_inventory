import React from 'react';
import { Inventory, SlotWithItem } from '../../typings';
import { durabilityLevel, formatWeight, getItemLabel, getItemUrl } from '../../helpers';
import { t } from '../../store/locale';

interface Props {
  item: SlotWithItem;
  inventoryType: Inventory['type'];
  hotkey?: number;
}

const SlotContent: React.FC<Props> = ({ item, inventoryType, hotkey }) => {
  const isShop = inventoryType === 'shop';
  const showCount = !isShop && item.count > 1;
  const isMoney = item.name === 'money';

  return (
    <>
      <img className="slot-image" src={getItemUrl(item)} alt="" draggable={false} />
      {hotkey !== undefined && <span className="slot-hotkey">{hotkey}</span>}
      {!isShop && item.weight > 0 && <span className="slot-weight">{formatWeight(item.weight)}</span>}
      {isShop && item.count !== undefined && item.count > 0 && <span className="slot-weight">{item.count}</span>}
      {isShop && item.price !== undefined && item.price > 0 ? (
        item.currency && item.currency !== 'money' && item.currency !== 'black_money' ? (
          <span className="slot-count slot-price">
            <img src={getItemUrl(item.currency)} alt="" />
            {item.price.toLocaleString('en-US')}
          </span>
        ) : (
          <span className={`slot-count slot-price ${item.currency === 'black_money' ? 'is-dirty' : ''}`}>
            {t('ui_currency')}
            {item.price.toLocaleString('en-US')}
          </span>
        )
      ) : (
        (showCount || isMoney) && (
          <span className="slot-count">
            {isMoney
              ? `${t('ui_currency')}${item.count.toLocaleString('en-US')}`
              : `×${item.count.toLocaleString('en-US')}`}
          </span>
        )
      )}
      {!showCount && !isMoney && !(isShop && item.price) && <span className="slot-label">{getItemLabel(item)}</span>}
      {!isShop && item.durability !== undefined && (
        <span className={`slot-durability is-${durabilityLevel(item.durability)}`}>
          <i style={{ width: `${Math.max(0, Math.min(100, item.durability))}%` }} />
        </span>
      )}
    </>
  );
};

export default SlotContent;
