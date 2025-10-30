import { api } from "./client";

// Events
export async function getMyEvents() {
  const { data } = await api.get("/events");
  return data;
}
export async function createMyEvent(body: { title: string; startTime: string; endTime: string; status?: string }) {
  const { data } = await api.post("/events", body);
  return data;
}
export async function updateMyEvent(id: string, body: any) {
  const { data } = await api.put(`/events/${id}`, body);
  return data;
}
export async function deleteMyEvent(id: string) {
  return api.delete(`/events/${id}`);
}

// Requests / Swaps
export async function getRequests() {
  const { data } = await api.get("/requests");
  return data as { incoming: any[]; outgoing: any[] };
}
export async function postSwapResponse(id: string, accept: boolean) {
  const { data } = await api.post(`/swap-response/${id}`, { accept });
  return data;
}
export async function cancelSwapRequest(id: string) {
  const { data } = await api.post(`/swap-cancel/${id}`, {});
  return data;
}
export async function getSwapHistory() {
  const { data } = await api.get("/swap-history");
  return data as any[];
}




