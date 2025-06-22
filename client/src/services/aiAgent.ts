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
          text: "Give me a daily mission for my golem",
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
      throw error; 
    }
  }

  static async getDailyMission(): Promise<string> {
    return await this.fetchDailyMission();
  }
}