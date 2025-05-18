import { db } from './db';

const ELIZA_URL = import.meta.env.VITE_ELIZA_URL;

interface AIMessageResponse {
  user: string;
  text: string;
  action: string;
}

export class AIAgentService {
  private static async fetchDailyMission(): Promise<string> {
    try {
      
      const response = await fetch(ELIZA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "Give me a daily mission for my golem", // TODO: Provide dinamically the golem name and map available
          userId: "user",
          userName: "User"
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily mission');
      }

      const rawData = await response.text();
      const data: AIMessageResponse[] = rawData ? JSON.parse(rawData) : [];
      const firstMessage = data[0];
      
      if (!firstMessage || !firstMessage.text) {
        throw new Error('No mission found in response');
      }

      return firstMessage.text;
      
    } catch (error) {
      console.error('Error fetching daily mission:', error);
      return 'Default mission: Complete 3 battles today!';
    }
  }

  static async getDailyMission(playerAddress: string | undefined | null): Promise<string> {

    if (!playerAddress || typeof playerAddress !== 'string') {
      return 'Default mission: Complete 3 battles today!';
    }

    try {
      const cachedMission = await db.dailyMissions
        .where('playerAddress')
        .equals(playerAddress)
        .last();

      if (cachedMission) {
        const now = Date.now();
        const missionAge = now - cachedMission.timestamp;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (missionAge < twentyFourHours) {
          return cachedMission.mission;
        }
      }

      const newMission = await this.fetchDailyMission();
      
      if (!newMission) {
        throw new Error('Failed to get new mission');
      }

      // First try to delete any existing mission for the player
      await db.dailyMissions
        .where('playerAddress')
        .equals(playerAddress)
        .delete();

      // Then add the new mission
      await db.dailyMissions.add({
        playerAddress,
        mission: newMission,
        timestamp: Date.now()
      });
      return newMission;
    } catch (error) {
      console.error('Error in getDailyMission:', error);
      return 'Default mission: Complete 3 battles today!';
    }
  }
} 