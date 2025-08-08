import { Role } from './role-type';

export interface Message {
  role: Role;
  text: string;
}
