export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  WRITER = 'writer',
  READER = 'reader'
}

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  bio?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  bio?: string;
}

export interface UserPermission {
  action: string;
  resource: string;
}

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
  description: string;
}