import { OverviewSection } from './OverviewSection';
import './OverviewCollapsible.css';

type OverviewCollapsibleProps = {
  isOpen: boolean;
  onToggle: () => void;
  id?: string;
};

export function OverviewCollapsible({ isOpen, onToggle, id = 'overview' }: OverviewCollapsibleProps) {
  return (
    <section
      id={id}
      className={`planOverviewCollapsible ${isOpen ? 'planOverviewCollapsibleOpen' : ''}`}
      aria-label="Overview"
    >
      <button
        type="button"
        className="planOverviewToggle"
        aria-expanded={isOpen}
        aria-controls="plan-overview-panel"
        onClick={onToggle}
      >
        <span className="planOverviewToggleLabel">Overview</span>
        <span className="planOverviewToggleHint">
          {isOpen ? 'Hide festival info' : 'Festival info, artists, venue & more'}
        </span>
        <span className="planOverviewChevron" aria-hidden="true">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      <div
        id="plan-overview-panel"
        className="planOverviewPanel"
        hidden={!isOpen}
      >
        <OverviewSection />
      </div>
    </section>
  );
}
