import { t } from '../../store/locale';
import React from 'react';
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useTransitionStyles,
} from '@floating-ui/react';
import Icon, { Key, Mouse, MouseAction } from '../utils/Icon';

interface Props {
  infoVisible: boolean;
  setInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const controls: { keys?: string[]; mouse: MouseAction; label: string }[] = [
  { mouse: 'right', label: 'ui_rmb' },
  { keys: ['alt'], mouse: 'left', label: 'ui_alt_lmb' },
  { keys: ['ctrl'], mouse: 'left', label: 'ui_ctrl_lmb' },
  { keys: ['shift'], mouse: 'drag', label: 'ui_shift_drag' },
  { keys: ['ctrl', 'shift'], mouse: 'left', label: 'ui_ctrl_shift_lmb' },
  { mouse: 'wheel', label: 'ui_wheel_amount' },
];

const UsefulControls: React.FC<Props> = ({ infoVisible, setInfoVisible }) => {
  const { refs, context } = useFloating({
    open: infoVisible,
    onOpenChange: setInfoVisible,
  });

  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
  });

  const { isMounted, styles } = useTransitionStyles(context, { duration: 160 });

  const { getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      {isMounted && (
        <FloatingPortal>
          <FloatingOverlay lockScroll className="controls-overlay" data-open={infoVisible} style={styles}>
            <FloatingFocusManager context={context}>
              <div ref={refs.setFloating} {...getFloatingProps()} className="panel controls-dialog" style={styles}>
                <header className="panel-header">
                  <div className="panel-icon">
                    <Icon name="help" />
                  </div>
                  <div className="panel-title">
                    <b>{t('ui_usefulcontrols')}</b>
                  </div>
                  <button type="button" className="icon-button" onClick={() => setInfoVisible(false)}>
                    <Icon name="x" />
                  </button>
                </header>
                <ul className="controls-list">
                  {controls.map((control) => (
                    <li key={control.label}>
                      <span className="controls-combo">
                        {control.keys?.map((key) => (
                          <React.Fragment key={key}>
                            <Key>{t(`ui_key_${key}`)}</Key>
                            <span className="hint-plus">+</span>
                          </React.Fragment>
                        ))}
                        <Mouse action={control.mouse} />
                      </span>
                      <span>{t(control.label)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </>
  );
};

export default UsefulControls;
