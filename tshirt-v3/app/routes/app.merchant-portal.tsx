export default function VuePage() {
  return (
    <div style={{ height: '100vh' }}>
      <iframe
        src="/vue/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  )
}