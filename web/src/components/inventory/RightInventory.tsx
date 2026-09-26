import InventoryGrid from './InventoryGrid';
import { useAppSelector } from '../../store';
import { selectRightInventory } from '../../store/inventory';

const RightInventory: React.FC = () => {
  const rightInventory = useAppSelector(selectRightInventory);

  if (!rightInventory.id || rightInventory.type === 'newdrop') return null;

  return <InventoryGrid inventory={rightInventory} side="right" />;
};

export default RightInventory;
