/**
 * Utility functions for the Chat application
 */

export function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}


export function chatIdentify(role: string) {
  return ['system', 'assistant', 'robot'].includes(role);
}