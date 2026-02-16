import React from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
}

const Barcode: React.FC<BarcodeProps> = ({ value, width = 200, height = 60 }) => {
  // Generate a deterministic barcode pattern from the string
  const generateBars = (str: string): number[] => {
    const bars: number[] = [];
    // Start pattern
    bars.push(2, 1, 1, 2, 1, 1);
    
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      bars.push(
        ((code >> 0) & 1) + 1,
        ((code >> 1) & 1) + 1,
        ((code >> 2) & 1) + 1,
        ((code >> 3) & 1) + 1,
        ((code >> 4) & 1) + 1,
        ((code >> 5) & 1) + 1,
      );
    }
    // End pattern
    bars.push(2, 1, 1, 1, 2, 1, 2);
    return bars;
  };

  const bars = generateBars(value);
  const totalUnits = bars.reduce((sum, b) => sum + b, 0);
  const unitWidth = width / totalUnits;

  let x = 0;
  const rects: React.ReactNode[] = [];

  bars.forEach((barWidth, i) => {
    const w = barWidth * unitWidth;
    if (i % 2 === 0) {
      // Even index = black bar
      rects.push(
        <rect key={i} x={x} y={0} width={w} height={height} fill="#0a192f" />
      );
    }
    x += w;
  });

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {rects}
      </svg>
      <span className="text-xs font-mono text-gray-600 tracking-wider">{value}</span>
    </div>
  );
};

export default Barcode;
