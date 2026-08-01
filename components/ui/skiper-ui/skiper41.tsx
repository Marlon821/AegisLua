import React from "react";

type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
};

// Skiper UI's progressive-blur preset (skiper41).
export function ProgressiveBlur({ className = "", backgroundColor = "#08090d", position = "top", height = "120px", blurAmount = "5px" }: ProgressiveBlurProps) {
  const isTop = position === "top";
  return <div className={`pointer-events-none absolute left-0 z-10 w-full select-none ${className}`} style={{ [isTop ? "top" : "bottom"]: 0, height, background: isTop ? `linear-gradient(to top, transparent, ${backgroundColor})` : `linear-gradient(to bottom, transparent, ${backgroundColor})`, maskImage: isTop ? "linear-gradient(to bottom, black 45%, transparent)" : "linear-gradient(to top, black 45%, transparent)", WebkitBackdropFilter: `blur(${blurAmount})`, backdropFilter: `blur(${blurAmount})` }} />;
}
