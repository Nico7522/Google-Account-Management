export interface Chat {
  id: number;
  text: string;
  role: Role;
}

export type Role = 'AGENT' | 'USER';
