// The light design of hania360.com: a soft daylight background with colored glows instead of the night sky,
// white cards with colored edges, and the same sky/indigo/pink gradients of the brand.
// It is layered over the original (dark) CSS, so /classic and HOME_CLASSIC="1" still show the old site exactly.
export const LIGHT_CSS = `
:root{color-scheme:light;--ink:#14213D;--ink2:#46546E;--ink3:#6B7891;--line:#E3E6F2;--c1:#0EA5E9;--c2:#6366F1;--c3:#EC4899;--glass:#FFFFFF;--edge:#E3E6F2;--glow:0 1px 2px rgba(20,33,61,.06),0 14px 34px -18px rgba(99,102,241,.35);background:#FBFAFF;color:var(--ink)}
body{color:var(--ink);background:radial-gradient(55% 38% at 100% 0%,rgba(99,102,241,.16),transparent 70%),radial-gradient(50% 34% at 0% 18%,rgba(14,165,233,.14),transparent 70%),radial-gradient(45% 30% at 85% 62%,rgba(236,72,153,.10),transparent 70%),radial-gradient(50% 30% at 10% 95%,rgba(251,191,36,.12),transparent 70%),#FBFAFF}
body::before{background-image:radial-gradient(rgba(99,102,241,.14) 1px,transparent 1.2px);background-size:22px 22px;-webkit-mask-image:radial-gradient(80% 50% at 50% 12%,#000 20%,transparent 75%);mask-image:radial-gradient(80% 50% at 50% 12%,#000 20%,transparent 75%)}
.mark{background:linear-gradient(135deg,#0EA5E9,#6366F1 60%,#EC4899);border:0;color:#fff;box-shadow:0 6px 16px -6px rgba(99,102,241,.6)}
.brand{color:var(--ink)}.nav{color:var(--ink2)}.nav a:hover{background:rgba(99,102,241,.10);color:var(--ink)}
.account{border-color:#CBD2E6;color:var(--ink2);background:#fff}.account.on{color:var(--ink)}.account.in{color:#fff}
.hero h1,.legal h1,.section-title h2{color:var(--ink)}
.hero.home h1{background:linear-gradient(100deg,#0369A1,#4F46E5 55%,#DB2777);-webkit-background-clip:text;background-clip:text;color:transparent;filter:none}
.eyebrow{color:#4F46E5}.tiny,.section-title p,.lead,.muted,.card p{color:var(--ink2)}
.cta,.cta.big{background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;box-shadow:0 12px 26px -12px rgba(99,102,241,.8)}
.ghost-cta{background:#fff;border-color:#C7D2FE;color:#3730A3}
.step,.card,.tile,.mini,.today-card,.content,.legal{background:#fff!important;border:1px solid var(--line)!important;box-shadow:var(--glow);backdrop-filter:none;-webkit-backdrop-filter:none;color:var(--ink)}
.legal{background:transparent!important;border:0!important;box-shadow:none}
.content p,.content li,.legal p,.legal li{color:#33415C}.content a,.legal a{color:#4F46E5}.step b{color:#4F46E5}
.today-card small{color:var(--ink2)}
footer{color:var(--ink3);border-top:1px solid var(--line)}
.h26-brand{color:#0284C7}.h26-brand b{color:#DB2777}
.h26-hero h1{color:var(--ink)}
.h26-hero h1 span{background:linear-gradient(90deg,#0284C7,#6366F1 50%,#DB2777);-webkit-background-clip:text;background-clip:text;color:transparent}
.h26-lead{color:var(--ink2)}
.h26-now{color:var(--ink);background:linear-gradient(135deg,#E0F2FE,#EDE9FE 60%,#FCE7F3);border:1px solid #C7D2FE;box-shadow:0 12px 26px -16px rgba(99,102,241,.6)}.h26-now small{color:#4F46E5}
.h26-search{background:#fff;border:1px solid #CBD2E6;box-shadow:0 10px 28px -18px rgba(20,33,61,.4)}.h26-search:focus-within{border-color:#6366F1;box-shadow:0 0 0 4px rgba(99,102,241,.15)}
.h26-search input{color:var(--ink)}.h26-search input::placeholder{color:#8A94AB}
.h26-res{background:#fff;border-color:var(--line);box-shadow:0 24px 50px -16px rgba(20,33,61,.35)}.h26-r{color:var(--ink)}.h26-r:hover,.h26-r:focus{background:#EEF2FF}.h26-r small,.h26-none{color:var(--ink3)}
.h26-sec h2,.h26-acct h2{color:var(--ink)}
.h26-acct{background:linear-gradient(135deg,#FFF7ED,#FDF2F8 55%,#EEF2FF);border:1px solid #FED7AA}.h26-acct ul{color:var(--ink2)}
.h26-guides a{color:var(--ink2);background:#fff;border-color:var(--line)}.h26-guides a:hover{border-color:#6366F1;color:var(--ink)}
.h26-fine{color:var(--ink3)}
.t26-tabs button{background:#fff;border-color:var(--line);color:var(--ink2)}
.t26-tabs button[aria-selected="true"]{background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;border-color:transparent}
.t26{background:#fff;border:1px solid var(--line);color:var(--ink);box-shadow:0 1px 2px rgba(20,33,61,.04)}.t26:hover{border-color:#A5B4FC}.t26 small{color:var(--ink3)}
.w26{box-shadow:0 22px 40px -22px var(--a),0 2px 6px rgba(20,33,61,.08)}
/* עכשיו */
.n26-head h2{background:linear-gradient(90deg,#0284C7,#6366F1 55%,#DB2777);background-clip:text;-webkit-background-clip:text;background-clip:text;color:transparent}
.n26-live{color:#E11D48}.n26-live i{background:#E11D48}.n26-date{color:var(--ink3)}
.n26-tk{background:#fff;border:1px solid var(--line);color:var(--ink2);box-shadow:0 1px 2px rgba(20,33,61,.05)}.n26-tk b{color:var(--ink)}
.n26-card{background:#fff;border:1px solid var(--line);box-shadow:var(--glow)}
.n26-card.lead{background:radial-gradient(120% 140% at 100% 0%,color-mix(in srgb,var(--k) 14%,transparent),transparent 60%),#fff}
.n26-card::before{height:4px}
.n26-card h3{color:var(--ink)}.n26-card p{color:#33415C}.n26-meta,.n26-src{color:var(--ink3)}
.n26-chip{color:color-mix(in srgb,var(--k) 70%,#14213D);background:color-mix(in srgb,var(--k) 14%,#fff);border-color:color-mix(in srgb,var(--k) 40%,#fff)}
.n26-big{color:color-mix(in srgb,var(--k) 75%,#14213D)}
.n26-app{border-top-color:var(--line)}.n26-card.lead .n26-app{background:#F8F9FE;border-color:var(--line)}
.n26-ic{background:color-mix(in srgb,var(--k) 16%,#fff)}.n26-app b{color:var(--ink)}.n26-app small{color:var(--ink3)}
.n26-go{color:#fff;background:linear-gradient(135deg,#0EA5E9,#6366F1)}
.n26-civic{color:var(--ink3);border-top-color:var(--line)}
.n26-sp{background:linear-gradient(135deg,#ECFDF5,#fff);border:1px solid #A7F3D0;color:#33415C}.n26-sp b{color:var(--ink)}.n26-sp small{color:var(--ink3)}.n26-sp.live{border-color:#FB7185;background:linear-gradient(135deg,#FFF1F2,#fff)}
.n26-hint{color:var(--ink3)}
`;
