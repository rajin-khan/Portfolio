export default function PlaceholderCard({ nextDate, nextIssueNumber, position, itemWidth }) {
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

  return (
    <div
      className="carousel-item placeholder-card"
      style={{
        transform: `scale(${scale}) translateX(${translateX}px)`,
        opacity,
        zIndex,
        width: `${itemWidth}px`,
        flexShrink: 0,
      }}
    >
      <div className="carousel-item-date">{nextDate}</div>
      <div className="carousel-item-inner placeholder-inner">
        <div className="placeholder-logo-container">
          <img
            src="/assets/images/curatedlogo.png"
            alt="Curated Logo"
            className="placeholder-logo"
          />
        </div>
      </div>
      <div className="carousel-item-number">{nextIssueNumber}</div>
    </div>
  );
}

