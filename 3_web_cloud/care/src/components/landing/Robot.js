export default function Robot({ dark }){
  const sky    = dark ? "#38bdf8" : "#0ea5e9";
  const amber  = dark ? "#fbbf24" : "#f59e0b";
  const body   = dark ? "#1e293b" : "#e2e8f0";
  const bodyD  = dark ? "#0f172a" : "#cbd5e1";
  const metal  = dark ? "#334155" : "#94a3b8";
  const screen = dark ? "#0c1a2e" : "#0f172a";

  return (
    <svg viewBox="0 0 300 380" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs mx-auto">
      <defs>
        <filter id="eg"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="es"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="eyeg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
          <stop offset="35%" stopColor={sky}/>
          <stop offset="100%" stopColor={dark ? "#0369a1" : "#075985"}/>
        </radialGradient>
        <radialGradient id="bodyg" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor={body}/>
          <stop offset="100%" stopColor={bodyD}/>
        </radialGradient>
      </defs>

      {/* Body shadow */}
      <ellipse cx="150" cy="360" rx="70" ry="10" fill={dark ? "#0f172a" : "#cbd5e1"} opacity="0.4"/>

      {/* Wheels */}
      <ellipse cx="100" cy="338" rx="28" ry="14" fill={bodyD} stroke={metal} strokeWidth="2"/>
      <ellipse cx="100" cy="338" rx="14" ry="7" fill={screen}/>
      <ellipse cx="100" cy="338" rx="4" ry="2.5" fill={metal} opacity="0.7"/>
      <ellipse cx="200" cy="338" rx="28" ry="14" fill={bodyD} stroke={metal} strokeWidth="2"/>
      <ellipse cx="200" cy="338" rx="14" ry="7" fill={screen}/>
      <ellipse cx="200" cy="338" rx="4" ry="2.5" fill={metal} opacity="0.7"/>

      {/* Body */}
      <rect x="65" y="175" width="170" height="152" rx="20" fill="url(#bodyg)"/>
      <rect x="65" y="175" width="170" height="152" rx="20" fill="none" stroke={metal} strokeWidth="1" opacity="0.5"/>
      {/* Body panel */}
      <rect x="85" y="195" width="130" height="72" rx="10" fill={screen} stroke={sky} strokeWidth="1.2" opacity="0.9"/>
      {/* Heartbeat line */}
      <polyline points="93,231 103,231 110,216 118,246 125,224 131,231 149,231 154,222 159,240 165,231 177,231" fill="none" stroke={sky} strokeWidth="1.8" filter="url(#es)" opacity="0.95"/>
      {/* Bottom status dots */}
      <circle cx="105" cy="290" r="5" fill="#22c55e" filter="url(#es)"/>
      <circle cx="120" cy="290" r="5" fill={sky} filter="url(#es)"/>
      <circle cx="135" cy="290" r="5" fill={amber} filter="url(#es)"/>

      {/* Arms */}
      <rect x="20" y="183" width="44" height="88" rx="14" fill="url(#bodyg)" stroke={metal} strokeWidth="1" opacity="0.8"/>
      <ellipse cx="42" cy="284" rx="16" ry="11" fill={bodyD} stroke={metal} strokeWidth="1.2"/>
      <rect x="236" y="183" width="44" height="88" rx="14" fill="url(#bodyg)" stroke={metal} strokeWidth="1" opacity="0.8"/>
      <ellipse cx="258" cy="284" rx="16" ry="11" fill={bodyD} stroke={metal} strokeWidth="1.2"/>

      {/* Neck */}
      <rect x="132" y="149" width="36" height="30" rx="5" fill={bodyD}/>
      <rect x="139" y="152" width="7" height="24" rx="3" fill={metal} opacity="0.4"/>
      <rect x="154" y="152" width="7" height="24" rx="3" fill={metal} opacity="0.4"/>

      {/* Head */}
      <rect x="72" y="50" width="156" height="103" rx="24" fill="url(#bodyg)"/>
      <rect x="72" y="50" width="156" height="103" rx="24" fill="none" stroke={metal} strokeWidth="1" opacity="0.5"/>
      {/* Head bottom ridge */}
      <rect x="72" y="128" width="156" height="8" rx="4" fill={bodyD} opacity="0.6"/>

      {/* Eye sockets */}
      <rect x="86" y="63" width="56" height="55" rx="14" fill={screen} stroke={sky} strokeWidth="1.5" filter="url(#es)"/>
      <rect x="158" y="63" width="56" height="55" rx="14" fill={screen} stroke={sky} strokeWidth="1.5" filter="url(#es)"/>
      {/* Eyes */}
      <circle cx="114" cy="90" r="20" fill="url(#eyeg)" filter="url(#eg)"/>
      <circle cx="186" cy="90" r="20" fill="url(#eyeg)" filter="url(#eg)"/>
      {/* Pupils */}
      <circle cx="114" cy="90" r="8" fill={screen}/>
      <circle cx="186" cy="90" r="8" fill={screen}/>
      {/* Shine */}
      <circle cx="108" cy="84" r="3.5" fill="white" opacity="0.7"/>
      <circle cx="180" cy="84" r="3.5" fill="white" opacity="0.7"/>

      {/* Smile */}
      <path d="M 108 128 Q 150 142 192 128" fill="none" stroke={metal} strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>

      {/* Antenna */}
      <line x1="150" y1="50" x2="150" y2="18" stroke={metal} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="150" cy="13" r="8" fill={amber} filter="url(#eg)"/>
      <circle cx="150" cy="13" r="3.5" fill="white" opacity="0.85"/>

      {/* Cheek blushes (amigable!) */}
      <ellipse cx="88" cy="108" rx="10" ry="6" fill={amber} opacity="0.18"/>
      <ellipse cx="212" cy="108" rx="10" ry="6" fill={amber} opacity="0.18"/>
    </svg>
  );
};