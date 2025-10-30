export type EventStatus = "BUSY" | "SWAPPABLE" | "SWAP_PENDING";

export interface EventInput {
  title: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  status?: EventStatus;
}





