import { useEffect, useRef } from "react"
import { mount, unmount } from "../../merchant-portal/dist/vue-app.js"

export default function VuePortal() {
  const ref = useRef<HTMLDivElement>(null)

  // giả lập data (sau này thay bằng loader thật)
  const shop = "xuan-viet-store.myshopify.com"
  const token = "demo-token"

  useEffect(() => {
    if (!ref.current) return

    console.log("Mount Vue với:", { shop, token })

    mount(ref.current, { shop, token })

    return () => {
      console.log("Unmount Vue")
      unmount()
    }
  }, [])

  return <div ref={ref} />
}