import type { QueuePilotBridge } from '../preload/preload';

declare global {
  interface Window {
    queuepilot: QueuePilotBridge;
  }
}

declare module '*.png' {
  const url: string;
  export default url;
}

export {};
