import type { PublicSettings, Settings } from './types';
export const root: string;
export function loadEnvironment(): void;
export function readSettings(env?: NodeJS.ProcessEnv): Settings;
export function publicSettings(settings: Settings): PublicSettings;
export function httpUrl(value: string, name: string): string;
