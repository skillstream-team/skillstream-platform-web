import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableTabsProps {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const SwipeableTabs: React.FC<SwipeableTabsProps> = ({ 
  tabs, 
  defaultTab,
  onTabChange 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        const nextTab = tabs[currentIndex + 1];
        setActiveTab(nextTab.id);
        scrollToTab(currentIndex + 1);
      } else if (isRightSwipe && currentIndex > 0) {
        const prevTab = tabs[currentIndex - 1];
        setActiveTab(prevTab.id);
        scrollToTab(currentIndex - 1);
      }
    }
  };

  const scrollToTab = (index: number) => {
    if (tabsContainerRef.current) {
      const tabElement = tabsContainerRef.current.children[index] as HTMLElement;
      if (tabElement) {
        const container = tabsContainerRef.current;
        const scrollLeft = tabElement.offsetLeft - container.offsetLeft - (container.offsetWidth / 2) + (tabElement.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  const handleTabClick = (tabId: string, index: number) => {
    setActiveTab(tabId);
    scrollToTab(index);
  };

  const handleScroll = () => {
    if (tabsContainerRef.current) {
      setScrollPosition(tabsContainerRef.current.scrollLeft);
    }
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = tabsContainerRef.current && 
    scrollPosition < (tabsContainerRef.current.scrollWidth - tabsContainerRef.current.clientWidth);

  const scroll = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="relative mb-6">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 px-3 flex items-center"
            style={{ 
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.95), transparent)'
            }}
          >
            <ChevronLeft className="h-5 w-5" style={{ color: '#00B5AD' }} />
          </button>
        )}
        
        <div
          ref={tabsContainerRef}
          onScroll={handleScroll}
          className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2 px-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, index)}
                className={`px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isActive ? 'scale-105' : ''
                }`}
                style={{
                  backgroundColor: isActive ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                  color: isActive ? 'white' : '#0B1E3F',
                  boxShadow: isActive ? '0 4px 14px rgba(0, 181, 173, 0.3)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 px-3 flex items-center"
            style={{ 
              background: 'linear-gradient(to left, rgba(255, 255, 255, 0.95), transparent)'
            }}
          >
            <ChevronRight className="h-5 w-5" style={{ color: '#00B5AD' }} />
          </button>
        )}
      </div>

      {/* Tab Content with Swipe */}
      <div
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="overflow-hidden"
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${tabs.findIndex(t => t.id === activeTab) * 100}%)`,
            width: `${tabs.length * 100}%`
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="flex-shrink-0 px-1"
              style={{ width: `${100 / tabs.length}%` }}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

