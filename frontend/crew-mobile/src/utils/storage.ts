import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@crewsync_auth_token',
  CREW_ID: '@crewsync_crew_id',
  CREW_PROFILE: '@crewsync_crew_profile',
};

class StorageService {
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  }

  async setCrewId(crewId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.CREW_ID, crewId);
  }

  async getCrewId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.CREW_ID);
  }

  async setCrewProfile(profile: object): Promise<void> {
    await AsyncStorage.setItem(KEYS.CREW_PROFILE, JSON.stringify(profile));
  }

  async getCrewProfile<T>(): Promise<T | null> {
    const profile = await AsyncStorage.getItem(KEYS.CREW_PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }
}

export const storage = new StorageService();
export default storage;
