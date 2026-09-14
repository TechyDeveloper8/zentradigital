import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target.closest('a, button, input, textarea, [data-cursor], .minimal-card');
      if (target) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hide custom cursor on mobile touch devices
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      <div
        className={`custom-cursor ${isHovered ? 'custom-cursor-hover' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: 'none',
        }}
      />

      <div
        className="custom-cursor-dot"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
