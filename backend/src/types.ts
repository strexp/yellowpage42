export interface Config {
  server: {
    host: string;
    port: number;
    jwtSecret: string;
    frontendUrl: string;
    backendUrl: string;
  };
  db: string;
  oauth: OAuthProvider[];
}

export interface OAuthProvider {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
}

export interface User {
  mnt: string;
  name: string;
  telephony: string;
  created_at: string;
}

export interface PhonebookEntry {
  id: number;
  mnt: string;
  number: string;
  name: string;
  type: string;
  language: string;
  hidden: number;
}

export interface JwtPayload {
  mnt: string;
  iat?: number;
  exp?: number;
}
