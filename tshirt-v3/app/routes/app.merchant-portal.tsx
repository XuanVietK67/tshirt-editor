export default function VuePage() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <iframe
        src="/vue/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}
