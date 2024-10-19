import React, { useEffect, useRef } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { TrafficData } from '../utils/trafficOptimization';

interface TrafficSimulationProps {
  trafficData: TrafficData;
  optimizedTiming: number;
  clearanceTime: number;
}

const formatClearanceTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const TrafficSimulation: React.FC<TrafficSimulationProps> = ({ trafficData, optimizedTiming, clearanceTime }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;

    const drawTraffic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw roads
      ctx.fillStyle = '#333';
      ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
      ctx.fillRect(canvas.width / 2 - 40, 0, 80, canvas.height);

      // Draw lane markings
      ctx.strokeStyle = '#FFF';
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Draw cars for each direction
      const directions = [
        { congestion: trafficData.congestionLevel, x: 0, y: canvas.height / 2 - 30, dx: 3, dy: 0 },
        { congestion: (trafficData.congestionLevel + 20) % 100, x: canvas.width / 2 + 30, y: canvas.height, dx: 0, dy: -3 },
        { congestion: (trafficData.congestionLevel + 40) % 100, x: canvas.width, y: canvas.height / 2 + 30, dx: -3, dy: 0 },
        { congestion: (trafficData.congestionLevel + 60) % 100, x: canvas.width / 2 - 30, y: 0, dx: 0, dy: 3 },
      ];

      directions.forEach(dir => {
        const carCount = Math.floor(dir.congestion / 5);
        for (let i = 0; i < carCount; i++) {
          const offset = (i * 50 + frame * 3) % (canvas.width / 2 - 60);
          const x = dir.x + offset * dir.dx;
          const y = dir.y + offset * dir.dy;
          ctx.fillStyle = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'][i % 4];
          ctx.fillRect(x, y, 20, 20);
        }
      });

      // Draw traffic lights
      directions.forEach((dir, index) => {
        const lightX = [canvas.width - 30, canvas.width / 2 + 50, 30, canvas.width / 2 - 50][index];
        const lightY = [canvas.height / 2 - 50, canvas.height - 30, canvas.height / 2 + 50, 30][index];
        const isGreen = (Math.floor(frame / 60) + index) % 2 === 0;
        ctx.fillStyle = isGreen ? '#00FF00' : '#FF0000';
        ctx.beginPath();
        ctx.arc(lightX, lightY, 10, 0, 2 * Math.PI);
        ctx.fill();
      });

      frame++;
      requestAnimationFrame(drawTraffic);
    };

    drawTraffic();
  }, [trafficData]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">Traffic Junction Simulation</h2>
      <canvas ref={canvasRef} width={600} height={600} className="mb-4" />
      <div className="flex items-center justify-center space-x-8">
        <div className="text-center">
          <AlertCircle size={64} className={trafficData.congestionLevel > 60 ? 'text-red-500' : 'text-green-500'} />
          <p className="mt-2">Average Congestion Level</p>
          <p className={`font-bold ${trafficData.congestionLevel > 60 ? 'text-red-500' : 'text-green-500'}`}>
            {trafficData.congestionLevel.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {optimizedTiming.toFixed(0)}s
          </div>
          <p className="mt-2">Optimized Timing</p>
        </div>
        <div className="text-center">
          <Clock size={64} className="text-purple-500" />
          <p className="mt-2">Estimated Clearance Time</p>
          <p className="font-bold text-purple-500">{formatClearanceTime(clearanceTime)}</p>
        </div>
      </div>
    </div>
  );
};

export default TrafficSimulation;