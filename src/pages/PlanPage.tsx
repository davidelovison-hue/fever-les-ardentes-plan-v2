import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AddToCartToast } from '../components/AddToCartToast';
import { CartPanel } from '../components/CartPanel';
import { FestivalGallery } from '../components/FestivalGallery';
import { FestivalNavbar } from '../components/FestivalNavbar';
import { OverviewCollapsible } from '../components/OverviewCollapsible';
import { OverviewTicketsCta } from '../components/OverviewTicketsCta';
import { PlanCategorySection } from '../components/PlanCategorySection';
import { PlanTabs } from '../components/PlanTabs';
import { useCart } from '../lib/cartContext';
import { scrollPageToTop } from '../lib/scrollPageToTop';
import { useIsMobile } from '../lib/useIsMobile';
import { PLAN_CATALOG } from '../data/planCatalog';
import './PlanPage.css';

function getTabFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'overview') return 'tickets';
  if (hash === 'transport') return 'parking';
  if (hash === 'accompagnant') return 'pmr';
  if (hash && PLAN_CATALOG.some((category) => category.id === hash && category.id !== 'overview')) {
    return hash;
  }
  return 'tickets';
}

function shouldOpenOverviewFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === 'overview';
}

const TAB_SCROLL_GAP_PX = 12;
const STICKY_CHECK_TOLERANCE_PX = 2;

function getStickyOffsetPx() {
  const nav = document.querySelector<HTMLElement>('.planStickyNav');
  const tabs = document.querySelector<HTMLElement>('.planTabsSlot');
  const navH = nav?.getBoundingClientRect().height ?? 0;
  const tabsH = tabs?.getBoundingClientRect().height ?? 0;
  return navH + tabsH + TAB_SCROLL_GAP_PX;
}

function isTabsBarStickyNow() {
  const nav = document.querySelector<HTMLElement>('.planStickyNav');
  const tabs = document.querySelector<HTMLElement>('.planTabsSlot');
  const anchor = document.querySelector<HTMLElement>('.planTabsScrollAnchor');
  if (!tabs) return false;
  if (!anchor) return false;

  const navH = nav?.getBoundingClientRect().height ?? 0;
  // Sticky engages once we've scrolled past the anchor point (adjusted by nav height).
  const anchorDocTop = anchor.getBoundingClientRect().top + window.scrollY;
  return window.scrollY >= anchorDocTop - navH - STICKY_CHECK_TOLERANCE_PX;
}

function getScrollTargetEl(tabId: string) {
  const section = document.getElementById(tabId);
  if (!section) return null;
  // Prefer the filters row if it exists; otherwise fall back to section top.
  const chips = section.querySelector<HTMLElement>('.groupChipsWrap');
  if (chips) return chips;

  // Tabs without filters (e.g. Parking) should align to the first visible
  // content block/title, not the section wrapper, to avoid awkward whitespace.
  const firstTitle = section.querySelector<HTMLElement>('.groupCarouselTitle');
  if (firstTitle) return firstTitle;
  const firstBlock = section.querySelector<HTMLElement>('.groupBlock');
  return firstBlock ?? section;
}

function scheduleOverviewScroll() {
  let cancelled = false;
  let rafId = 0;

  const runOnce = () => {
    const overviewEl = document.querySelector<HTMLElement>('.planOverviewSlot');
    if (!overviewEl) return;
    overviewEl.scrollIntoView({ block: 'start', behavior: 'auto' });
    const offset = getStickyOffsetPx();
    if (offset > 0) window.scrollBy({ top: -offset, left: 0, behavior: 'auto' });
  };

  rafId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!cancelled) runOnce();
    });
  });

  return () => {
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

function scheduleActiveTabScroll(tabId: string) {
  let cancelled = false;
  let rafId = 0;

  const runOnce = () => {
    if (!isTabsBarStickyNow()) return;

    const targetEl = getScrollTargetEl(tabId);
    if (!targetEl) return;

    // Deterministic and robust: scroll the element into view, then compensate for
    // sticky navbar + tabs so the target isn't hidden underneath.
    targetEl.scrollIntoView({ block: 'start', behavior: 'auto' });
    const offset = getStickyOffsetPx();
    if (offset > 0) window.scrollBy({ top: -offset, left: 0, behavior: 'auto' });
  };

  rafId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!cancelled) runOnce();
    });
  });

  return () => {
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

export function PlanPage() {
  const location = useLocation();
  const { items } = useCart();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [isOverviewOpen, setIsOverviewOpen] = useState(shouldOpenOverviewFromHash);
  const [isTabsReached, setIsTabsReached] = useState(false);
  const tabsAnchorRef = useRef<HTMLDivElement>(null);
  const hasInitialTabScrollRef = useRef(false);
  const hasCart = items.length > 0;
  const showOverviewCta = isOverviewOpen && !hasCart && !isTabsReached;

  // Logo / home: land at the very top of the page (no section jump).
  useLayoutEffect(() => {
    if (location.pathname !== '/') return;
    const hash = location.hash.replace(/^#/, '');
    if (hash) return;
    setIsOverviewOpen(false);
    return scrollPageToTop();
  }, [location.pathname, location.hash, location.key]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (tabId === activeTab) return;
      setActiveTab(tabId);
      window.history.pushState(null, '', `#${tabId}`);
    },
    [activeTab],
  );

  const handleGoToTickets = useCallback(() => {
    setIsOverviewOpen(false);
    if (activeTab !== 'tickets') {
      setActiveTab('tickets');
      window.history.pushState(null, '', '#tickets');
    } else {
      window.history.replaceState(null, '', '#tickets');
      requestAnimationFrame(() => scheduleActiveTabScroll('tickets'));
    }
  }, [activeTab]);

  const handleOverviewToggle = useCallback(() => {
    setIsOverviewOpen((open) => !open);
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash === 'overview') {
        setIsOverviewOpen(true);
        return;
      }
      setActiveTab(getTabFromHash());
    };

    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('popstate', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  useEffect(() => {
    if (!isOverviewOpen) {
      setIsTabsReached(false);
      return;
    }

    const updateTabsReached = () => {
      const anchor = tabsAnchorRef.current;
      if (!anchor) return;
      const nav = document.querySelector<HTMLElement>('.planStickyNav');
      const navH = nav?.getBoundingClientRect().height ?? 0;
      setIsTabsReached(anchor.getBoundingClientRect().top <= navH + 2);
    };

    updateTabsReached();
    window.addEventListener('scroll', updateTabsReached, { passive: true });
    window.addEventListener('resize', updateTabsReached);

    return () => {
      window.removeEventListener('scroll', updateTabsReached);
      window.removeEventListener('resize', updateTabsReached);
    };
  }, [isOverviewOpen]);

  useEffect(() => {
    if (!isOverviewOpen) return;
    return scheduleOverviewScroll();
  }, [isOverviewOpen]);

  useEffect(() => {
    if (!hasInitialTabScrollRef.current) {
      hasInitialTabScrollRef.current = true;
      const hash = window.location.hash.replace(/^#/, '');
      if ((activeTab === 'tickets' && !hash) || hash === 'overview') {
        return;
      }
    }

    return scheduleActiveTabScroll(activeTab);
  }, [activeTab]);

  return (
    <div className={`planPage ${showOverviewCta ? 'planPageOverviewOpen' : ''}`}>
      <div className="planStickyNav">
        <FestivalNavbar />
      </div>

      <div className="planDesktopShell">
        <div className="planHeroSlot planHeroSlot--mediaHero">
          <FestivalGallery />
        </div>

        <h1 className="eventTitle">Les Ardentes 2026</h1>

        <div className="planOverviewSlot">
          <OverviewCollapsible isOpen={isOverviewOpen} onToggle={handleOverviewToggle} />
        </div>

        <div className="planTabsScrollAnchor" ref={tabsAnchorRef} aria-hidden="true" />
        <div className="planTabsSlot">
          <PlanTabs activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="planMainShell">
          <div className="planMainColumn">
            <div className="planContentColumn">
              {PLAN_CATALOG.filter((category) => category.id !== 'overview').map((category) => (
                <PlanCategorySection
                  key={category.id}
                  category={category}
                  isActive={activeTab === category.id}
                />
              ))}
            </div>
            {isMobile ? <AddToCartToast variant="mobile" /> : null}
          </div>
        </div>

        {isMobile && hasCart ? <CartPanel mode="mobile" /> : null}
        {!isMobile ? <CartPanel mode="desktop" /> : null}
      </div>

      {isOverviewOpen && !hasCart ? (
        <OverviewTicketsCta visible={showOverviewCta} onGoToTickets={handleGoToTickets} />
      ) : null}
    </div>
  );
}
