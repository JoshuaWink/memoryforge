import { useRef, useEffect } from 'react';
import { drawRadar } from '../../lib/charts.js';

export default function RadarChart({ scores }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (canvasRef.current) drawRadar(canvasRef.current, scores);
  }, [scores]);
  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={220}
      className="radar-chart"
      aria-label="Cognitive radar chart"
    />
  );
}
