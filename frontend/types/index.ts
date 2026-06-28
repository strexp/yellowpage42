export interface User {
  mnt: string;
  name: string;
  telephony: string[];
  canWrite: boolean;
}

export interface PhoneType {
  icon: string;
  color: string;
}

export interface PhoneEntry {
  id: number;
  number: string;
  name: string;
  type: string;
  language: string;
  hidden: boolean;
  sms: boolean;
}

export interface PublicEntry {
  mnt: string;
  mntName: string;
  number: string;
  name: string;
  type: string;
  language: string;
  sms: boolean;
}

export interface AuthProvider {
  id: string;
  name: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

declare module "#app" {
  interface NuxtApp {
    $api: <T = unknown>(url: string, options?: unknown) => Promise<T>;
  }
}
