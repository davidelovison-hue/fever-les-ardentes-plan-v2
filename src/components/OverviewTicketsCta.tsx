import './OverviewTicketsCta.css';

type OverviewTicketsCtaProps = {
  visible?: boolean;
  onGoToTickets: () => void;
};

export function OverviewTicketsCta({ visible = true, onGoToTickets }: OverviewTicketsCtaProps) {
  return (
    <div
      className={`overviewStickyCta ${visible ? '' : 'overviewStickyCtaHidden'}`}
      role="region"
      aria-label="Get tickets"
      aria-hidden={!visible}
    >
      <button type="button" className="overviewStickyCtaBtn" onClick={onGoToTickets}>
        Go to Festival Tickets
      </button>
    </div>
  );
}
