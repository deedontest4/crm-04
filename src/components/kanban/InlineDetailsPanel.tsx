import { cn } from "@/lib/utils";
import { DealExpandedPanel } from "@/components/DealExpandedPanel";
import { Deal } from "@/types/deal";

type TransitionState = 'idle' | 'expanding' | 'expanded' | 'collapsing';

interface InlineDetailsPanelProps {
  deal: Deal;
  transition: TransitionState;
  onClose: () => void;
  onOpenActionItemModal?: (actionItem?: any) => void;
}

export function InlineDetailsPanel({
  deal,
  transition,
  onClose,
  onOpenActionItemModal,
}: InlineDetailsPanelProps) {
  return (
    <div 
      className="flex flex-col overflow-y-auto"
      style={{ 
        minHeight: '650px',
        maxHeight: 'calc(120vh - 200px)',
      }}
    >
      <DealExpandedPanel 
        deal={deal} 
        onClose={onClose}
        onOpenActionItemModal={onOpenActionItemModal}
      />
    </div>
  );
}
