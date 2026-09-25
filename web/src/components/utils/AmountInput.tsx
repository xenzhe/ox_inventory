import React from 'react';
import Icon from './Icon';
import { t } from '../../store/locale';

interface Props {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

const clamp = (value: number, max?: number) => Math.max(0, max !== undefined ? Math.min(value, max) : value);

const AmountInput: React.FC<Props> = ({ value, max, onChange, className }) => {
  const set = (next: number) => onChange(clamp(next, max));

  const step = (direction: 1 | -1, event?: { shiftKey: boolean }) => {
    const size = event?.shiftKey ? 10 : 1;
    const base = value === 0 && direction === -1 && max !== undefined ? max : value;
    set(base + size * direction);
  };

  return (
    <div
      className={className ? `amount ${className}` : 'amount'}
      onWheel={(event) => step(event.deltaY < 0 ? 1 : -1, event)}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button type="button" tabIndex={-1} onClick={(event) => step(-1, event)}>
        <Icon name="minus" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value > 0 ? value.toLocaleString('en-US') : ''}
        placeholder={t('ui_all')}
        onChange={(event) => set(parseInt(event.target.value.replace(/\D/g, ''), 10) || 0)}
        onFocus={(event) => event.target.select()}
      />
      <button type="button" tabIndex={-1} onClick={(event) => step(1, event)}>
        <Icon name="plus" />
      </button>
    </div>
  );
};

export default AmountInput;
