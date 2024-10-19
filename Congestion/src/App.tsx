import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import TrafficSimulation from './components/TrafficSimulation';
import { TrafficData, optimizeSignalTiming } from './utils/trafficOptimization';

const formatClearanceTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const App: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficData>({
    congestionLevel: 0,
    timeOfDay: 0,
    waitTime: 0,
    vehicleCount: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate changing traffic conditions
      const newData: TrafficData = {
        congestionLevel: Math.random() * 100,
        timeOfDay: (new Date().getHours() + new Date().getMinutes() / 60) / 24 * 100,
        waitTime: Math.random() * 300,
        vehicleCount: Math.floor(Math.random() * 200) + 50,
      };
      setTrafficData(newData);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const { timing: optimizedTiming, clearanceTime } = optimizeSignalTiming(trafficData);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Intelligent Traffic Signal Optimization</h1>
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <TrafficSimulation trafficData={trafficData} optimizedTiming={optimizedTiming} clearanceTime={clearanceTime} />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Traffic Data:</h2>
            <p>Average Congestion Level: {trafficData.congestionLevel.toFixed(2)}%</p>
            <p>Time of Day: {new Date(trafficData.timeOfDay / 100 * 24 * 3600 * 1000).toLocaleTimeString()}</p>
            <p>Average Wait Time: {trafficData.waitTime.toFixed(2)} seconds</p>
            <p>Vehicle Count: {trafficData.vehicleCount}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Optimization Results:</h2>
            <p>Optimized Signal Timing: {optimizedTiming.toFixed(2)} seconds</p>
            <p>Estimated Clearance Time: {formatClearanceTime(clearanceTime)}</p>
          </div>
        </div>
        {trafficData.congestionLevel > 60 && (
          <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 flex items-center" role="alert">
            <AlertTriangle className="mr-2" />
            <p>High congestion alert! Average congestion level exceeds 60%.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;