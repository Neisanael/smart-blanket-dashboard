"use client";
import React from "react";
import "../../css/gradient-slider.css";

interface GradientSliderProps {
  icon: string;
  value?: number;
  setValue?: (val: number) => void;
  gradient: string;
  min?: number;
  max?: number;
  unit?: string;
  labelFunc?: (val: number) => string;
}

const GradientSlider: React.FC<GradientSliderProps> = ({
  icon,
  value,
  setValue,
  gradient,
  min = 0,
  max = 100,
  unit = "",
  labelFunc,
}) => {
  const safeValue = value ?? min;
  const percent = ((safeValue - min) / (max - min)) * 100;
  const gradientLeft = `${percent}%`;
  const backgroundStyle = {
    background: `linear-gradient(to right, ${gradient} ${gradientLeft}, #fff ${gradientLeft})`,
    "--slider-icon": `url(${icon})` as string, // kirim ke CSS
  } as React.CSSProperties;

  return (
    <div className="w-full relative h-12">
      <div className="text-white font-bold mb-1">
        {labelFunc ? labelFunc(safeValue) : `${safeValue}${unit}`}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={safeValue}
        onChange={(e) => setValue?.(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none bg-transparent"
        style={backgroundStyle}
      />
    </div>
  );
};

export default GradientSlider;
