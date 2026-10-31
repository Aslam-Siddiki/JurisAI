import React from "react";

/**
 * BeamBalanceLogo
 * A clean, modern SVG icon representing the scales of justice / beam balance
 * matching the authentic legal beam balance style in the user's interface.
 */
export default function BeamBalanceLogo({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central pillar / fulcrum */}
      <line x1="12" y1="3" x2="12" y2="21" />
      {/* Base stand */}
      <path d="M8 21h8" />
      {/* Pillar top ornament */}
      <circle cx="12" cy="3.5" r="1.25" fill={color} />
      {/* Horizontal balance beam */}
      <path d="M3 7.5h18" strokeWidth="2" />
      {/* Left pan strings */}
      <path d="M3 7.5l3.5 6" />
      <path d="M10 7.5l-3.5 6" />
      {/* Left pan */}
      <path d="M3 13.5c0 2 1.5 3 3.5 3s3.5-1 3.5-3z" fill={`${color}22`} />
      {/* Right pan strings */}
      <path d="M14 7.5l3.5 6" />
      <path d="M21 7.5l-3.5 6" />
      {/* Right pan */}
      <path d="M14 13.5c0 2 1.5 3 3.5 3s3.5-1 3.5-3z" fill={`${color}22`} />
    </svg>
  );
}
