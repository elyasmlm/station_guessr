import { apiClient } from "./apiClient";

export interface StationDTO {
  id: string;
  name: string;
  lines: string[];
  city: string;
  arrondissement?: number | null;
}

export async function fetchAllStations(): Promise<StationDTO[]> {
  const response = await apiClient.get<StationDTO[]>("/games/stations");
  return response.data;
}
