import { useState } from 'react';

export default function CarouselItem({ issueNumber, date, pdfPath, thumbnail, position, itemWidth }) {
  const [imageError, setImageError] = useState(false);
  
  // Calculate scale and opacity based on position (distance from center)
  const distanceFromCenter = Math.abs(position);
  const scale = Math.max(0.7, 1 - distanceFromCenter * 0.15);
  const opacity = Math.max(0.5, 1 - distanceFromCenter * 0.2);
  // Z-index: items CLOSER to center (smaller distance) should have HIGHER z-index
  // Center (distance 0) = highest z-index, further away = lower z-index
  // Use large multiplier to ensure center items are clearly in front
  // Clamp to ensure minimum z-index of 1
  const zIndex = Math.max(1, Math.round(10000 - distanceFromCenter * 500));
  // Add slight translateX for depth effect
  const translateX = position * 20;

  const handleClick = () => {
    window.open(pdfPath, '_blank');
  };

  return (
    <div
      className="carousel-item"
      style={{
        transform: `scale(${scale}) translateX(${translateX}px)`,
        opacity,
        zIndex,
        width: `${itemWidth}px`,
        flexShrink: 0,
      }}
      onClick={handleClick}
    >
      <div className="carousel-item-date">{date}</div>
      <div className="carousel-item-inner">
        {thumbnail && !imageError ? (
          <img
            src={thumbnail}
            alt={`Newsletter ${issueNumber}`}
            className="carousel-item-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="carousel-item-placeholder">
            <svg className="w-16 h-16 text-white opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="carousel-item-number">{issueNumber}</div>
    </div>
  );
}

