import { createApp } from 'vue'
import App from './App.vue'

let app: any = null

export function mount(el: HTMLElement, props?: any) {
  app = createApp(App, props)
  app.mount(el)
}

export function unmount() {
  if (app) {
    app.unmount()
    app = null
  }
}