export type Role = "student" | "teacher";

export interface JoinRoomPayload{
    username: string;
    roomId: string;
    role: Role;
}