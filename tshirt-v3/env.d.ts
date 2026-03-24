/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

export {}

declare global {
  interface Window {
    __SHOP__?: string
    __TOKEN__?: string
    __APP_BRIDGE__?: any
  }
}