# import os
# import sys


# if "SUMO_HOME" in os.environ:
#     tools = os.path.join(os.environ["SUMO_HOME"], "tools")
#     sys.path.append(tools)
# else:
#     sys.exit("Please declare the environment variable 'SUMO_HOME'")
# import numpy as np
# import pandas as pd
# import ray
# import traci
# from ray import tune
# from ray.rllib.algorithms.ppo import PPOConfig
# from ray.rllib.env.wrappers.pettingzoo_env import ParallelPettingZooEnv
# from ray.tune.registry import register_env

# import sumo_rl


# if __name__ == "__main__":
#     ray.init()

#     env_name = "4x4grid"

#     register_env(
#         env_name,
#         lambda _: ParallelPettingZooEnv(
#             sumo_rl.parallel_env(
#                 net_file="sumo_rl/nets/4x4-Lucas/4x4.net.xml",
#                 route_file="sumo_rl/nets/4x4-Lucas/4x4c1c2c1c2.rou.xml",
#                 out_csv_name="outputs/4x4grid/ppo",
#                 use_gui=False,
#                 num_seconds=80000,
#             )
#         ),
#     )

#     config = (
#         PPOConfig()
#         .environment(env=env_name, disable_env_checking=True)
#         .rollouts(num_rollout_workers=4, rollout_fragment_length=128)
#         .training(
#             train_batch_size=512,
#             lr=2e-5,
#             gamma=0.95,
#             lambda_=0.9,
#             use_gae=True,
#             clip_param=0.4,
#             grad_clip=None,
#             entropy_coeff=0.1,
#             vf_loss_coeff=0.25,
#             sgd_minibatch_size=64,
#             num_sgd_iter=10,
#         )
#         .debugging(log_level="ERROR")
#         .framework(framework="torch")
#         .resources(num_gpus=int(os.environ.get("RLLIB_NUM_GPUS", "0")))
#     )

#     tune.run(
#         "PPO",
#         name="PPO",
#         stop={"timesteps_total": 100000},
#         checkpoint_freq=10,
#         local_dir="~/ray_results/" + env_name,
#         config=config.to_dict(),
#     )

# import ray
# from ray import tune
# from ray.rllib.algorithms.ppo import PPOConfig

# # Initialize Ray
# ray.init()

# config = (
#     PPOConfig()
#     .environment("SumoEnvironment")
#     .rollouts(num_env_runners=4)  # Updated from num_rollout_workers
# )

# # Run the experiment with the corrected storage path
# tune.run(
#     "PPO",
#     config=config,
#     storage_path="C:/Users/h357d/Downloads/sumo-rl-results",  # Update this with your preferred directory
# )









import numpy as np
import subprocess
import traci
from dqn_agent import DQNAgent  # Assuming you have a DQNAgent class defined in dqn_agent.py

class SumoIntersection:
    def init(self):
        self.cellLength = 5.0  # Length of each cell in meters
        self.offset = 0.0      # Offset for position calculations
        self.speedLimit = 30.0  # Speed limit in m/s

    def getState(self):
        positionMatrix = np.zeros((12, 12), dtype=np.float32)  # Adjust dimensions as needed
        velocityMatrix = np.zeros((12, 12), dtype=np.float32)

        vehicles_road4 = traci.edge.getLastStepVehicleIDs('road4')  # Example edge ID
        junctionPosition = traci.junction.getPosition('0')[1]  # Example junction ID

        for v in vehicles_road4:
            ind = int(abs((junctionPosition - traci.vehicle.getPosition(v)[1] + self.offset)) / self.cellLength)
            if ind < 12:
                lane_index = traci.vehicle.getLaneIndex(v)
                positionMatrix[7 + lane_index][ind] = 1
                velocityMatrix[7 + lane_index][ind] = traci.vehicle.getSpeed(v) / self.speedLimit

        positionMatrix = np.asarray(positionMatrix, dtype=np.float32)
        velocityMatrix = np.asarray(velocityMatrix, dtype=np.float32)

        turn_demand = np.array([[traci.junction.getTurnDemand('0', '2o'), 
                                  traci.junction.getTurnDemand('0', '1o')]], dtype=np.float32)

        return [positionMatrix, velocityMatrix, turn_demand]

    def simulate(self, agent):
        step = 0
        total_reward = 0

        while step < 1000:  # Define maximum steps per episode
            step += 1
            state = self.getState()
            action = agent.act(state)
            self.take_action(action)
            next_state = self.getState()
            reward = self.get_reward()
            done = False
            
            agent.remember(state, action, reward, next_state, done)
            total_reward += reward
            
            if len(agent.memory) > 32:
                agent.replay(32)  # Batch size for replay

        return total_reward

    def take_action(self, action):
        if action == 0:
            # Scenario: stop the traffic on road 1, 2 and 3
            traci.trafficlight.setPhase('0', 0)
            traci.trafficlight.setPhase('1', 1)
            traci.trafficlight.setPhase('2', 2)
            traci.trafficlight.setPhase('3', 3)
        elif action == 1:
            # Scenario: stop the traffic on road 1, 4 and allow road 2
            traci.trafficlight.setPhase('0', 0)
            traci.trafficlight.setPhase('1', 1)
            traci.trafficlight.setPhase('2', 2)
            traci.trafficlight.setPhase('3', 0)

    def get_reward(self):
        reward = -5.0
        try:
            waiting_vehicles = traci.edge.getLastStepVehicleIDs('0')  # Example edge ID for waiting vehicles
            reward -= (len(waiting_vehicles) * 0.1)   # Penalize based on waiting vehicles
        except traci.TraCIException as e:
            print(f"Error retrieving vehicle data: {e}")
        
        return reward

    @staticmethod
    def generate_routefile():
        # Implement route generation logic here if needed.
        pass


if name == "main":
    agent = DQNAgent()
    SumoIntersection().generate_routefile()
    
    sumoBinary = checkBinary('sumo')  
    sumoCmd = [sumoBinary, "-c", "intersection.sumocfg", "--no-warnings", "--start", "--quit"]

    process = subprocess.Popen(sumoCmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    try:
        traci.start(sumoCmd)

        for episode in range(100):  # Number of episodes to train the agent
            total_reward = SumoIntersection().simulate(agent)
            print(f"Episode {episode + 1}: Total reward = {total_reward}")

    except KeyboardInterrupt:
        print("Simulation interrupted.")
        
    finally:
        traci.close()
        process.communicate()  # Ensure the process terminates cleanly