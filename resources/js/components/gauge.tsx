"use client";
import React from "react";
import ReactSpeedometer from "react-d3-speedometer";

interface GaugeProps {
  value?: number | null;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
}

const Gauge: React.FC<GaugeProps> = ({
  value = 0,
  min = 0,
  max = 100,
  unit = "°C",
  label = "Suhu",
}) => {
  return (
    <div className="flex flex-col items-center text-white">
      <div className="text-xl font-bold mb-1">
        {typeof value === "number" ? value.toFixed(1) : `--`} {unit}
      </div>

      <ReactSpeedometer
        value={value ?? 0}
        minValue={min}
        maxValue={max}
        needleHeightRatio={0.7}
        segments={3}
        segmentColors={["#4CAF50", "#FFEB3B", "#F44336"]}
        ringWidth={30}
        width={200}
        height={120}
        currentValueText=" "
        valueFormat=""
        customSegmentLabels={[]}
        maxSegmentLabels={0}
      />

      <div className="mt-1 text-sm font-semibold">{label}</div>
    </div>
  );
};

export default Gauge;
