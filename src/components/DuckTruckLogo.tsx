import React, { useState } from "react";

interface DuckTruckLogoProps {
  className?: string;
  size?: number;
  logoType?: "duck" | "custom_url";
  customLogoUrl?: string;
}

export default function DuckTruckLogo({
  className = "w-10 h-10",
  size,
  logoType = "duck",
  customLogoUrl
}: DuckTruckLogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const finalClass = size ? `w-${size} h-${size}` : className;

  if (logoType === "custom_url" && customLogoUrl && !useFallback) {
    return (
      <img
        src={customLogoUrl}
        alt="NakNak Custom Logo"
        className={`${finalClass} object-contain rounded-xl`}
        referrerPolicy="no-referrer"
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={finalClass} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Modern Typographic Logo "NakNak" - Stacked for perfect fit in square containers */}
      <text
        x="50"
        y="45"
        fill="#0F172A"
        fontSize="38"
        fontWeight="900"
        fontFamily='"Space Grotesk", "Inter", system-ui, sans-serif'
        textAnchor="middle"
        letterSpacing="-1"
      >
        Nak
      </text>
      <text
        x="50"
        y="82"
        fill="#EA580C"
        fontSize="38"
        fontWeight="900"
        fontFamily='"Space Grotesk", "Inter", system-ui, sans-serif'
        textAnchor="middle"
        letterSpacing="-1"
      >
        Nak
      </text>
    </svg>
  );
}
