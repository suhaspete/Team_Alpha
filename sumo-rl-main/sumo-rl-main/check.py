import gymnasium as gym
import sumo_rl

env = gym.make('sumo-rl-v0',
               net_file='path_to_your_network.net.xml',
               route_file='path_to_your_routefile.rou.xml',
               out_csv_name='path_to_output.csv',
               use_gui=True,
               num_seconds=100000)
obs, info = env.reset()
done = False
while not done:
    next_obs, reward, terminated, truncated, info = env.step(env.action_space.sample())
    done = terminated or truncated
