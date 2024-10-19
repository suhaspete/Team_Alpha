import * as tf from '@tensorflow/tfjs';

export interface TrafficData {
  congestionLevel: number;
  timeOfDay: number;
  waitTime: number;
  vehicleCount: number;
}

// Simple neural network model for signal timing optimization
const createModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [4] }));
  model.add(tf.layers.dense({ units: 1 }));
  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
  return model;
};

const model = createModel();

// Train the model with some initial data
const trainModel = async () => {
  const trainingData = tf.tensor2d([
    [20, 25, 30, 50], [40, 50, 60, 100], [60, 75, 90, 150], [80, 100, 120, 200]
  ]);
  const trainingLabels = tf.tensor2d([
    [30], [45], [60], [75]
  ]);

  await model.fit(trainingData, trainingLabels, {
    epochs: 100,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
      }
    }
  });
};

trainModel();

const calculateClearanceTime = (data: TrafficData, optimizedTiming: number): number => {
  // Assume an average intersection can handle about 20 vehicles per minute under optimal conditions
  const baseFlowRate = 20;
  
  // Adjust flow rate based on congestion level
  const adjustedFlowRate = baseFlowRate * (1 - data.congestionLevel / 100);
  
  // Calculate how many vehicles can pass through in one cycle
  const vehiclesPerCycle = (adjustedFlowRate * optimizedTiming) / 60;
  
  // Estimate the number of cycles needed to clear all vehicles
  const cyclesNeeded = Math.ceil(data.vehicleCount / vehiclesPerCycle);
  
  // Calculate total clearance time in minutes
  const clearanceTimeMinutes = (cyclesNeeded * optimizedTiming) / 60;
  
  // Add a small random factor to account for real-world variability (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  
  return Math.round(clearanceTimeMinutes * randomFactor);
};

export const optimizeSignalTiming = (data: TrafficData): { timing: number, clearanceTime: number } => {
  const input = tf.tensor2d([[data.congestionLevel, data.timeOfDay, data.waitTime, data.vehicleCount]]);
  const prediction = model.predict(input) as tf.Tensor;
  const optimizedTiming = Math.max(30, Math.min(120, prediction.dataSync()[0])); // Clamp between 30 and 120 seconds
  
  const clearanceTime = calculateClearanceTime(data, optimizedTiming);
  
  return {
    timing: optimizedTiming,
    clearanceTime: clearanceTime
  };
};