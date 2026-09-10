export type ReviewColor = "red" | "yellow" | "green";

export interface ReviewHighlight {
  id: string;
  from: number;
  to: number;
  color: ReviewColor;
}