import type { QueuePilotBridge } from '../preload/index';

declare global {
  interface Window {
    queuepilot: QueuePilotBridge;
  }
}

export {};
