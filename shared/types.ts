export type Role = 'admin' | 'pj' | 'user';
export interface Credential { email: string; password: string }
export interface Contract {
  reviewed: boolean;
  routes: { login: string; dashboard: string };
  selectors: { email: string; password: string; submit: string; validationError: string;
    togglePassword: string; dashboardReady: string; logout: string };
  api: { enabled: boolean; loginPath: string; emailField: string; passwordField: string;
    messageField: string; invalidAuthStatus: number };
}
export interface PublicSettings {
  target: 'demo' | 'staging'; baseURL: string; apiBaseURL: string; contract: Contract;
  roles: Role[]; runId: string; buildId: string;
}
export interface Settings extends PublicSettings { credentials: Record<Role, Credential> }
