import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;
  loopId: string;
  content: string;
  posterId: string;
  anon: boolean;
  aura: number;
  createdAt: Timestamp;
}

export interface Loop {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  inviteOnly: boolean;
  tags: string[];
  avatarUrl?: string;
}
