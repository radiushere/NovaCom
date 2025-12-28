import React from 'react';

const GlassCard = ({ children, className = "" }) => {
  return (
    <div className={`
      bg-museum-surface
      border border-museum-stone
      rounded-none
      p-8
      shadow-sm
      text-museum-text
      transition-all duration-300
      hover:shadow-md
      ${className}
    `}>
      {children}
    </div>
  );
};

export default GlassCard;