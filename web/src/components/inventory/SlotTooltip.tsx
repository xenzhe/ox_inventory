import { Inventory, SlotWithItem } from '../../typings';
import React, { Fragment, useMemo } from 'react';
import { Items } from '../../store/items';
import { t } from '../../store/locale';
import { useAppSelector } from '../../store';
import { durabilityLevel, formatWeight, getItemLabel, getItemUrl, getRarity } from '../../helpers';
import Markdown from '../utils/Markdown';
import Icon, { Hint, Key } from '../utils/Icon';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </>
);

const SlotTooltip: React.ForwardRefRenderFunction<
  HTMLDivElement,
  { item: SlotWithItem; inventoryType: Inventory['type']; style: React.CSSProperties }
> = ({ item, inventoryType, style }, ref) => {
  const additionalMetadata = useAppSelector((state) => state.inventory.additionalMetadata);
  const itemData = useMemo(() => Items[item.name], [item]);
  const ingredients = useMemo(() => {
    if (!item.ingredients) return null;
    return Object.entries(item.ingredients).sort((a, b) => a[1] - b[1]);
  }, [item]);
  const description = item.metadata?.description || itemData?.description;
  const ammoName = itemData?.ammoName && Items[itemData.ammoName]?.label;
  const rarity = getRarity(item);
  const isCrafting = inventoryType === 'crafting';
  const unitWeight = item.count > 1 ? item.weight / item.count : item.weight;
  const components: string[] = item.metadata?.components || [];

  const subtitle = item.metadata?.type || (rarity?.tier ? t(`ui_rarity_${rarity.tier}`) : undefined);

  return (
    <div
      className="panel tooltip"
      ref={ref}
      data-rarity={rarity?.tier}
      style={{ ...style, ...(rarity?.color ? { '--rarity': rarity.color } : {}) } as React.CSSProperties}
    >
      <div className="tooltip-header">
        <div>
          <b>{getItemLabel(item)}</b>
          {subtitle && <span className={rarity ? 'tooltip-rarity' : undefined}>{subtitle}</span>}
        </div>
        {isCrafting ? (
          <small className="tooltip-duration">
            <Icon name="clock" />
            {(item.duration !== undefined ? item.duration : 3000) / 1000}s
          </small>
        ) : (
          <small>{item.name}</small>
        )}
      </div>

      {description && <Markdown content={description} className="tooltip-description" />}

      {isCrafting ? (
        ingredients && (
          <ul className="tooltip-ingredients">
            {ingredients.map(([name, count]) => (
              <li key={`ingredient-${name}`}>
                <img src={getItemUrl(name)} alt="" />
                <span>{Items[name]?.label || name}</span>
                <em>{count >= 1 ? `×${count}` : count === 0 ? '' : `${count * 100}%`}</em>
              </li>
            ))}
          </ul>
        )
      ) : (
        <dl className="tooltip-stats">
          {item.weight > 0 && (
            <Row label={t('ui_weight')}>
              {item.count > 1
                ? `${formatWeight(unitWeight)} · ${formatWeight(item.weight)} ${t('ui_kg')}`
                : `${formatWeight(item.weight)} ${t('ui_kg')}`}
            </Row>
          )}
          {item.durability !== undefined && (
            <Row label={t('ui_durability')}>
              <span className={`meter is-${durabilityLevel(item.durability)}`}>
                <i style={{ width: `${Math.max(0, Math.min(100, item.durability))}%` }} />
              </span>
              {Math.trunc(item.durability)}%
            </Row>
          )}
          {item.metadata?.ammo !== undefined && <Row label={t('ui_ammo')}>{item.metadata.ammo}</Row>}
          {ammoName && <Row label={t('ui_ammo_type')}>{ammoName}</Row>}
          {item.metadata?.serial && <Row label={t('ui_serial')}>{item.metadata.serial}</Row>}
          {components.length > 0 && (
            <Row label={t('ui_components')}>{components.map((c) => Items[c]?.label || c).join(', ')}</Row>
          )}
          {item.metadata?.weapontint && <Row label={t('ui_tint')}>{item.metadata.weapontint}</Row>}
          {additionalMetadata.map((data, index) => (
            <Fragment key={`metadata-${index}`}>
              {item.metadata && item.metadata[data.metadata] && (
                <Row label={data.value}>{String(item.metadata[data.metadata])}</Row>
              )}
            </Fragment>
          ))}
        </dl>
      )}

      {inventoryType === 'player' && (
        <div className="tooltip-footer">
          <Hint mouse="drag" label={t('ui_hint_move')} />
          <Hint mouse="right" label={t('ui_hint_options')} />
          <Hint keys={<Key>{t('ui_key_alt')}</Key>} mouse="left" label={t('ui_use')} />
        </div>
      )}
    </div>
  );
};

export default React.forwardRef(SlotTooltip);
