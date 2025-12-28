import { useState, useEffect, useRef, useCallback } from 'react';
import CarouselItem from './CarouselItem';
import PlaceholderCard from './PlaceholderCard';

export default function Carousel({ newsletters, nextDate, nextIssueNumber }) {
    const [thumbnails, setThumbnails] = useState({});
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const carouselRef = useRef(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    // Responsive dimensions - always start with desktop to avoid hydration mismatch
    // Will update on mount to match actual screen size
    const [dimensions, setDimensions] = useState({ itemWidth: 350, itemGap: 40 });

    const { itemWidth, itemGap } = dimensions;

    // Load PDF.js and generate thumbnails
    useEffect(() => {
        const loadPDFJS = async () => {
            // Check if PDF.js is already loaded
            if (window.pdfjsLib) {
                generateThumbnails();
                return;
            }

            // Load PDF.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    generateThumbnails();
                }
            };
            script.onerror = () => {
                console.warn('Failed to load PDF.js, thumbnails will not be generated');
            };
            document.head.appendChild(script);
        };

        const generateThumbnails = async () => {
            const newThumbnails = {};

            for (const newsletter of newsletters) {
                try {
                    const loadingTask = window.pdfjsLib.getDocument(newsletter.pdfPath);
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);

                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    newThumbnails[newsletter.issueNumber] = canvas.toDataURL('image/jpeg', 0.8);
                } catch (error) {
                    console.error(`Error generating thumbnail for ${newsletter.issueNumber}:`, error);
                }
            }

            setThumbnails(newThumbnails);
        };

        loadPDFJS();
    }, [newsletters]);

  // Calculate scroll position to center a specific item
  // CSS margin-left centers the first item, so scroll position accounts for that
  const getScrollPositionForItem = useCallback((index) => {
    const carousel = carouselRef.current;
    if (!carousel) return 0;
    
    const itemWidthWithGap = itemWidth + itemGap;
    // Track has margin-left to center first item, so scroll position is just index * itemWidthWithGap
    return index * itemWidthWithGap;
  }, [itemWidth, itemGap]);

    // Get currently centered item index
    const getCurrentCenteredIndex = useCallback(() => {
        const carousel = carouselRef.current;
        if (!carousel) return 0;

        const itemWidthWithGap = itemWidth + itemGap;
        // Current scroll position relative to items (CSS padding is handled automatically)
        const scrollInItems = carousel.scrollLeft;
        const currentIndex = Math.round(scrollInItems / itemWidthWithGap);

        const totalItems = newsletters.length + 1; // Include placeholder
        return Math.max(0, Math.min(totalItems - 1, currentIndex));
    }, [itemWidth, itemGap, newsletters.length]);

    // Snap to nearest item when scrolling stops
    const snapToNearestItem = useCallback(() => {
        const carousel = carouselRef.current;
        if (!carousel || isScrollingRef.current) return;

        const currentIndex = getCurrentCenteredIndex();
        const targetScroll = getScrollPositionForItem(currentIndex);
        const currentScroll = carousel.scrollLeft;

        // Only snap if we're off by more than a few pixels
        if (Math.abs(currentScroll - targetScroll) > 5) {
            isScrollingRef.current = true;
            carousel.scrollTo({
                left: targetScroll,
                behavior: 'smooth',
            });

            setTimeout(() => {
                isScrollingRef.current = false;
            }, 300);
        }
    }, [getCurrentCenteredIndex, getScrollPositionForItem]);

    // Update scroll button states
    const updateScrollButtons = useCallback(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const scrollLeft = carousel.scrollLeft;
        const totalItems = newsletters.length + 1; // Include placeholder
        
        // Calculate the maximum scroll position for the last item
        const maxItemScroll = getScrollPositionForItem(totalItems - 1);
        
        // Account for margins: track has margin-left and margin-right
        // The actual max scroll is the item position (margins are handled by CSS)
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        
        // Use the calculated max item scroll, but ensure we don't exceed actual scrollWidth
        const effectiveMaxScroll = Math.min(maxScroll, maxItemScroll + 20);

        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < effectiveMaxScroll - 10);
    }, [newsletters.length, getScrollPositionForItem]);

  // Handle responsive dimensions - update on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth <= 768;
      const newDimensions = isMobile 
        ? { itemWidth: 250, itemGap: 20 }
        : { itemWidth: 350, itemGap: 40 };
      
      setDimensions(prev => {
        // Only update if dimensions actually changed
        if (prev.itemWidth !== newDimensions.itemWidth || prev.itemGap !== newDimensions.itemGap) {
          return newDimensions;
        }
        return prev;
      });
    };

    // Update immediately on mount
    updateDimensions();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateDimensions, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

    // Initialize carousel position
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const initialize = () => {
            // Ensure both scrollWidth and clientWidth are ready, and track has proper dimensions
            const track = carousel.querySelector('.carousel-track');
            if (carousel.scrollWidth > 0 && carousel.clientWidth > 0 && track && track.offsetWidth > 0) {
                // Ensure first item is centered on initial load
                // CSS margin-left handles viewport-based centering, so scrollLeft should be 0
                carousel.scrollLeft = 0;
                updateScrollButtons();
            } else {
                requestAnimationFrame(initialize);
            }
        };

        // Small delay on mobile to ensure viewport is fully ready
        const delay = typeof window !== 'undefined' && window.innerWidth <= 768 ? 50 : 0;
        if (delay > 0) {
            setTimeout(() => {
                requestAnimationFrame(initialize);
            }, delay);
        } else {
            requestAnimationFrame(initialize);
        }
    }, [updateScrollButtons, itemWidth, itemGap]);

    // Handle scroll events
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        let rafId;
        const handleScroll = () => {
            cancelAnimationFrame(rafId);

            rafId = requestAnimationFrame(() => {
                updateScrollButtons();

                // Clear previous snap timeout
                clearTimeout(scrollTimeoutRef.current);

                // Snap after user stops scrolling
                scrollTimeoutRef.current = setTimeout(() => {
                    if (!isScrollingRef.current) {
                        snapToNearestItem();
                    }
                }, 150);
            });
        };

        carousel.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            carousel.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(rafId);
            clearTimeout(scrollTimeoutRef.current);
        };
    }, [updateScrollButtons, snapToNearestItem]);

    // Handle mouse wheel - scroll one item at a time
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        const handleWheel = (e) => {
            // Only handle vertical scrolling (deltaY)
            if (Math.abs(e.deltaY) > 0 && !isScrollingRef.current) {
                e.preventDefault();

                const currentIndex = getCurrentCenteredIndex();
                const direction = e.deltaY > 0 ? 1 : -1;
                const totalItems = newsletters.length + 1;
                const targetIndex = Math.max(0, Math.min(totalItems - 1, currentIndex + direction));

                if (targetIndex !== currentIndex) {
                    const targetScroll = getScrollPositionForItem(targetIndex);
                    isScrollingRef.current = true;

                    carousel.scrollTo({
                        left: targetScroll,
                        behavior: 'smooth',
                    });

                    setTimeout(() => {
                        isScrollingRef.current = false;
                    }, 400);
                }
            }
        };

        carousel.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            carousel.removeEventListener('wheel', handleWheel);
        };
    }, [getCurrentCenteredIndex, getScrollPositionForItem, newsletters.length]);

    // Navigate with arrow buttons
    const scrollToItem = (direction) => {
        const carousel = carouselRef.current;
        if (!carousel || isScrollingRef.current) return;

        const currentIndex = getCurrentCenteredIndex();
        const totalItems = newsletters.length + 1;
        const targetIndex = direction === 'left'
            ? Math.max(0, currentIndex - 1)
            : Math.min(totalItems - 1, currentIndex + 1);

        if (targetIndex !== currentIndex) {
            const targetScroll = getScrollPositionForItem(targetIndex);
            isScrollingRef.current = true;

            carousel.scrollTo({
                left: targetScroll,
                behavior: 'smooth',
            });

            setTimeout(() => {
                isScrollingRef.current = false;
            }, 400);
        }
    };

  // Calculate 3D position for each item
  const calculatePosition = (index) => {
    const carousel = carouselRef.current;
    if (!carousel || carousel.clientWidth === 0) return 0;
    
    const itemWidthWithGap = itemWidth + itemGap;
    const viewportCenter = carousel.clientWidth / 2;
    // Track margin-left centers first item: calc(50vw - itemWidth/2)
    const trackMargin = (carousel.clientWidth / 2) - (itemWidth / 2);
    
    // Item's center position in the track (accounting for margin)
    const itemCenterInTrack = (index * itemWidthWithGap) + (itemWidth / 2) + trackMargin;
    
    // Item's position relative to viewport
    const itemCenterInViewport = itemCenterInTrack - carousel.scrollLeft;
    
    // Distance from center in item units
    const distanceFromCenter = (itemCenterInViewport - viewportCenter) / itemWidthWithGap;
    
    return distanceFromCenter;
  };

    // Force re-render for 3D effect
    const [, setRenderKey] = useState(0);

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        let rafId;
        let lastUpdate = 0;

        const updatePositions = () => {
            const now = performance.now();
            if (now - lastUpdate < 16) {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(updatePositions);
                return;
            }
            lastUpdate = now;

            setRenderKey(prev => prev + 1);
        };

        const setup = () => {
            if (carousel.clientWidth > 0) {
                carousel.addEventListener('scroll', updatePositions, { passive: true });
                window.addEventListener('resize', updatePositions);
                updatePositions();
            } else {
                requestAnimationFrame(setup);
            }
        };

        setup();

        return () => {
            carousel.removeEventListener('scroll', updatePositions);
            window.removeEventListener('resize', updatePositions);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div className="carousel-wrapper">
            {canScrollLeft && (
                <button
                    className="carousel-nav-button carousel-nav-left"
                    onClick={() => scrollToItem('left')}
                    aria-label="Previous"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            )}

            <div className="carousel-container" ref={carouselRef}>
                <div className="carousel-track">
                    {newsletters.map((newsletter, index) => {
                        const position = calculatePosition(index);
                        return (
                            <CarouselItem
                                key={newsletter.issueNumber}
                                issueNumber={newsletter.issueNumber}
                                date={newsletter.date}
                                pdfPath={newsletter.pdfPath}
                                thumbnail={thumbnails[newsletter.issueNumber]}
                                position={position}
                                itemWidth={itemWidth}
                            />
                        );
                    })}
                    {newsletters.length > 0 && (
                        <PlaceholderCard
                            nextDate={nextDate}
                            nextIssueNumber={nextIssueNumber}
                            position={calculatePosition(newsletters.length)}
                            itemWidth={itemWidth}
                        />
                    )}
                </div>
            </div>

            {canScrollRight && (
                <button
                    className="carousel-nav-button carousel-nav-right"
                    onClick={() => scrollToItem('right')}
                    aria-label="Next"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            )}
        </div>
    );
}

