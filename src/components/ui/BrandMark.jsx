export default function BrandMark({ size = 38 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(135deg,#1E4F91 0%,#2C6AB8 50%,#2E9A5A 100%)',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.10)',
      }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
        <path d="M5 20 L11 14 L15 18 L24 8" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 8 H25 V14" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="9" y="22" width="2.6" height="4" fill="rgba(255,255,255,0.8)" rx="0.4"/>
        <rect x="13" y="20" width="2.6" height="6" fill="rgba(255,255,255,0.85)" rx="0.4"/>
        <rect x="17" y="17" width="2.6" height="9" fill="rgba(255,255,255,0.95)" rx="0.4"/>
      </svg>
    </div>
  );
}
