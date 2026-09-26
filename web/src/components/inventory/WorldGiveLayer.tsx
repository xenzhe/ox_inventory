import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDragDropManager, useDrop } from 'react-dnd';
import { DragSource, SlotWithItem } from '../../typings';
import { fetchNui } from '../../utils/fetchNui';
import useNuiEvent from '../../hooks/useNuiEvent';
import { store } from '../../store';
import { t } from '../../store/locale';
import { getItemLabel } from '../../helpers';
import { onDropGround } from '../../dnd/onDropGround';

type Candidate = {
  key: string;
  x: number;
  top: number;
  bottom: number;
  reason?: 'far' | 'blocked';
  npc?: boolean;
};

type Box = Candidate & { left: number; right: number; y1: number; y2: number };

const toBox = (candidate: Candidate): Box => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const y1 = candidate.top * height;
  const y2 = candidate.bottom * height;
  const half = Math.max((y2 - y1) * 0.24, 22);
  const cx = candidate.x * width;

  return { ...candidate, left: cx - half, right: cx + half, y1, y2 };
};

const pick = (boxes: Box[], cursor: { x: number; y: number } | null) => {
  if (!cursor) return;

  const hits = boxes.filter(
    (box) =>
      cursor.x >= box.left - 10 && cursor.x <= box.right + 10 && cursor.y >= box.y1 - 14 && cursor.y <= box.y2 + 10
  );

  hits.sort(
    (a, b) =>
      Number(!!a.reason) - Number(!!b.reason) ||
      Math.abs(cursor.x - (a.left + a.right) / 2) - Math.abs(cursor.x - (b.left + b.right) / 2)
  );

  return hits[0];
};

const giveCount = (source: DragSource) => {
  const { inventory } = store.getState();
  const slot = inventory.leftInventory.items[source.item.slot - 1] as SlotWithItem | undefined;

  if (!slot?.count) return { slot, count: 1 };

  if (inventory.shiftPressed && slot.count > 1) return { slot, count: Math.floor(slot.count / 2) };

  return { slot, count: inventory.itemAmount > 0 ? Math.min(inventory.itemAmount, slot.count) : slot.count };
};

const WorldGiveLayer: React.FC = () => {
  const manager = useDragDropManager();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const targetRef = useRef<Box | undefined>(undefined);

  const [{ aiming, source }, drop] = useDrop<DragSource, void, { aiming: boolean; source: DragSource | null }>(
    () => ({
      accept: 'SLOT',
      canDrop: (item) => item.inventory === 'player',
      collect: (monitor) => ({
        aiming: monitor.isOver({ shallow: true }) && monitor.canDrop(),
        source: monitor.getItem(),
      }),
      drop: (item) => {
        const target = targetRef.current;

        const { count } = giveCount(item);

        if (!target) return onDropGround(item.item.slot, count);

        if (target.reason) return;

        setSent(target.key);
        setTimeout(() => setSent(null), 450);
        fetchNui('worldGive', { slot: item.item.slot, count, target: target.key });
      },
    }),
    []
  );

  useNuiEvent<Candidate[]>('worldGiveCandidates', (data) => setCandidates(Array.isArray(data) ? data : []));

  const aimSent = useRef(false);
  const aimTimer = useRef<number>(0);

  useEffect(() => {
    window.clearTimeout(aimTimer.current);

    if (aiming && !aimSent.current) {
      aimSent.current = true;
      fetchNui('worldGiveAim', true);
    } else if (!aiming && aimSent.current) {
      aimTimer.current = window.setTimeout(
        () => {
          aimSent.current = false;
          fetchNui('worldGiveAim', false);
        },
        source ? 180 : 0
      );
    }

    document.body.classList.toggle('is-world-aiming', aiming);

    if (!aiming) {
      setCursor(null);
      return;
    }

    const monitor = manager.getMonitor();
    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCursor(monitor.getClientOffset()));
    };

    update();
    const unsubscribe = monitor.subscribeToOffsetChange(update);

    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [aiming, manager]);

  useEffect(
    () => () => {
      window.clearTimeout(aimTimer.current);
      document.body.classList.remove('is-world-aiming');
      fetchNui('worldGiveAim', false);
    },
    []
  );

  const boxes = useMemo(() => candidates.map(toBox), [candidates]);
  const target = aiming ? pick(boxes, cursor) : undefined;
  targetRef.current = target;

  const info = source && aiming ? giveCount(source) : undefined;
  const label = info?.slot ? getItemLabel(info.slot) : '';
  const status =
    target?.reason === 'far' ? t('ui_give_far') : target?.reason === 'blocked' ? t('ui_give_blocked') : null;

  return (
    <div
      ref={(element) => {
        drop(element);
      }}
      className={`world-give ${aiming ? 'is-aiming' : ''}`}
    >
      {aiming &&
        boxes.map((box) => {
          const active = target?.key === box.key;
          const className = [
            'world-give-target',
            active && 'is-active',
            box.reason && 'is-invalid',
            sent === box.key && 'is-sent',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={box.key}
              className={className}
              style={{ left: box.left, top: box.y1, width: box.right - box.left, height: box.y2 - box.y1 }}
            >
              <i />
              <i />
              <i />
              <i />
              {box.npc && <span className="world-give-tag">{t('ui_give_npc')}</span>}
            </div>
          );
        })}

      {aiming && cursor && (
        <div
          className={`world-give-chip ${target ? (status ? 'is-invalid' : 'is-ready') : ''}`}
          style={{ left: cursor.x, top: cursor.y }}
        >
          {status ?? (
            <>
              <b className={target ? undefined : 'is-drop'}>{t(target ? 'ui_give_to' : 'ui_drop')}</b>
              <span>{label}</span>
              {info && info.count > 1 && <em>×{info.count.toLocaleString('en-US')}</em>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldGiveLayer;
