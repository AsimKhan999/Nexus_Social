// import React from 'react';
// import '../styles/components/design-system.css';

// const DesignSystem = () => {
//   return (
//     <div>
//       <header className="ds-header">
//         <div className="ds-header-eyebrow">Social Network &middot; Design Preview</div>
//         <h1 className="ds-header-title">Nexus Social</h1>
//         <p className="ds-header-sub">A professional social media platform with a dark, editorial design system</p>
//       </header>

//       <div className="app-layout">
//         <aside className="sidebar">
//           <div className="sidebar-section">Main</div>
//           <a className="nav-item active" href="#!">
//             <i className="ti ti-home-2"></i> Home
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-search"></i> Discover
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-bell"></i> Notifications
//             <span className="nav-badge">4</span>
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-message-circle"></i> Messages
//             <span className="nav-badge">2</span>
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-bookmark"></i> Saved
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-user"></i> Profile
//           </a>
//           <div className="sidebar-section">Workspace</div>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-building"></i> Company Page
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-chart-bar"></i> Analytics
//           </a>
//           <a className="nav-item" href="#!">
//             <i className="ti ti-settings"></i> Settings
//           </a>
//         </aside>

//         <main className="feed">
//           <div className="compose-box">
//             <div className="compose-row">
//               <div className="compose-avatar">YO</div>
//               <div className="compose-placeholder">What's on your mind?</div>
//               <div className="compose-photo">
//                 <i className="ti ti-photo"></i>
//               </div>
//             </div>
//           </div>

//           <div className="post-card">
//             <div className="post-header">
//               <div className="post-author">
//                 <div className="post-avatar emerald">SR</div>
//                 <div className="post-author-info">
//                   <div className="post-author-name">
//                     Sofia Reyes
//                     <i className="ti ti-circle-check-filled"></i>
//                   </div>
//                   <div className="post-author-role">Director of Product &middot; s.reyes</div>
//                 </div>
//               </div>
//               <div className="post-time">2h ago</div>
//             </div>
//             <div className="post-body">
//               <strong>The most underrated skill in product management?</strong><br />
//               Saying &ldquo;no&rdquo; with clarity and empathy. Every feature request is an opportunity to strengthen your product vision &mdash; but only if you filter through the right lens.<br /><br />
//               <span className="hashtag">#ProductManagement</span> &nbsp; <span className="hashtag">#Leadership</span> &nbsp; <span className="hashtag">#Tech</span>
//             </div>
//             <div className="post-actions">
//               <button className="post-action liked">
//                 <i className="ti ti-heart-filled"></i> 412
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-message-circle"></i> 87
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-repeat"></i> 64
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-share"></i>
//               </button>
//             </div>
//           </div>

//           <div className="post-card">
//             <div className="post-header">
//               <div className="post-author">
//                 <div className="post-avatar purple">MK</div>
//                 <div className="post-author-info">
//                   <div className="post-author-name">
//                     Marcus Kim
//                     <i className="ti ti-circle-check-filled"></i>
//                   </div>
//                   <div className="post-author-role">Staff Engineer &middot; marcus.k</div>
//                 </div>
//               </div>
//               <div className="post-time">5h ago</div>
//             </div>
//             <div className="post-body">
//               Just shipped a complete auth microservice rewrite in Go. Cut latency by 60% and simplified the deploy pipeline.<br />
//               <span className="hashtag">#GoLang</span> &nbsp; <span className="hashtag">#Backend</span>
//             </div>
//             <div className="post-image-placeholder">
//               <span className="post-image-label">
//                 <i className="ti ti-photo"></i> auth-service-arch.png
//               </span>
//             </div>
//             <div className="post-actions">
//               <button className="post-action liked">
//                 <i className="ti ti-heart-filled"></i> 238
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-message-circle"></i> 42
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-repeat"></i> 31
//               </button>
//               <button className="post-action">
//                 <i className="ti ti-share"></i>
//               </button>
//             </div>
//           </div>
//         </main>

//         <aside className="right-panel">
//           <div className="panel-card profile-widget">
//             <div className="pw-avatar">YO</div>
//             <div className="pw-name">Yuki O.</div>
//             <div className="pw-role">Product Designer</div>
//             <div className="pw-stats">
//               <div>
//                 <div className="pw-stat-number">1,284</div>
//                 <div className="pw-stat-label">Followers</div>
//               </div>
//               <div>
//                 <div className="pw-stat-number">682</div>
//                 <div className="pw-stat-label">Following</div>
//               </div>
//               <div>
//                 <div className="pw-stat-number">143</div>
//                 <div className="pw-stat-label">Posts</div>
//               </div>
//             </div>
//           </div>

//           <div className="panel-card">
//             <div className="section-label">Trending</div>
//             <div className="trend-item">
//               <span className="trend-rank">1</span>
//               <div className="trend-info">
//                 <div className="trend-name">#ReactJS</div>
//                 <div className="trend-count">12.4k posts</div>
//               </div>
//               <i className="ti ti-trending-up trend-icon up"></i>
//             </div>
//             <div className="trend-item">
//               <span className="trend-rank">2</span>
//               <div className="trend-info">
//                 <div className="trend-name">#DesignSystems</div>
//                 <div className="trend-count">8.7k posts</div>
//               </div>
//               <i className="ti ti-trending-up trend-icon up"></i>
//             </div>
//             <div className="trend-item">
//               <span className="trend-rank">3</span>
//               <div className="trend-info">
//                 <div className="trend-name">#RemoteWork</div>
//                 <div className="trend-count">6.2k posts</div>
//               </div>
//               <i className="ti ti-minus trend-icon flat"></i>
//             </div>
//             <div className="trend-item">
//               <span className="trend-rank">4</span>
//               <div className="trend-info">
//                 <div className="trend-name">#TypeScript</div>
//                 <div className="trend-count">5.1k posts</div>
//               </div>
//               <i className="ti ti-trending-up trend-icon up"></i>
//             </div>
//           </div>

//           <div className="panel-card">
//             <div className="section-label">People to follow</div>
//             <div className="suggest-item">
//               <div className="suggest-avatar gold">AC</div>
//               <div className="suggest-info">
//                 <div className="suggest-name">Aria Chen</div>
//                 <div className="suggest-role">UX Researcher</div>
//               </div>
//               <button className="suggest-follow">+ Follow</button>
//             </div>
//             <div className="suggest-item">
//               <div className="suggest-avatar coral">JL</div>
//               <div className="suggest-info">
//                 <div className="suggest-name">Jake Liu</div>
//                 <div className="suggest-role">DevOps Lead</div>
//               </div>
//               <button className="suggest-follow">+ Follow</button>
//             </div>
//           </div>
//         </aside>
//       </div>

//       <section className="tokens-section">
//         <div className="section-label">Design Tokens</div>
//         <div className="tokens-grid">
//           <div>
//             <div className="tokens-subtitle">Colors</div>
//             <div className="color-chips">
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--bg-base)' }}></div>
//                 <span className="color-label">--bg-base &nbsp;#0d0f12</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--bg-surface)' }}></div>
//                 <span className="color-label">--bg-surface &nbsp;#13161b</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--bg-elevated)' }}></div>
//                 <span className="color-label">--bg-elevated &nbsp;#1a1e25</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--bg-hover)' }}></div>
//                 <span className="color-label">--bg-hover &nbsp;#1f2430</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--accent)' }}></div>
//                 <span className="color-label">--accent &nbsp;#4f8ef7</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--text-primary)' }}></div>
//                 <span className="color-label">--text-primary &nbsp;#e8eaf0</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--text-secondary)' }}></div>
//                 <span className="color-label">--text-secondary &nbsp;#8b909e</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--text-muted)' }}></div>
//                 <span className="color-label">--text-muted &nbsp;#555b6a</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--success)' }}></div>
//                 <span className="color-label">--success &nbsp;#3ecf8e</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--gold)' }}></div>
//                 <span className="color-label">--gold &nbsp;#c9a84c</span>
//               </div>
//               <div className="color-chip">
//                 <div className="color-swatch" style={{ background: 'var(--alert)' }}></div>
//                 <span className="color-label">--alert &nbsp;#f47387</span>
//               </div>
//             </div>
//           </div>

//           <div>
//             <div className="tokens-subtitle">Typography</div>
//             <div className="typo-row">
//               <span className="typo-label">28px</span>
//               <span className="typo-sample" style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>Nexus Social</span>
//             </div>
//             <div className="typo-row">
//               <span className="typo-label">18px</span>
//               <span className="typo-sample" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px' }}>Italic section heading</span>
//             </div>
//             <div className="typo-row">
//               <span className="typo-label">15px</span>
//               <span className="typo-sample" style={{ fontWeight: 500, fontSize: '15px' }}>Heading &mdash; DM Sans 500</span>
//             </div>
//             <div className="typo-row">
//               <span className="typo-label">14px</span>
//               <span className="typo-sample" style={{ fontWeight: 300, fontSize: '14px' }}>Body copy &mdash; DM Sans 300</span>
//             </div>
//             <div className="typo-row">
//               <span className="typo-label">13px</span>
//               <span className="typo-sample" style={{ fontWeight: 400, fontSize: '13px' }}>Secondary text &mdash; DM Sans 400</span>
//             </div>
//             <div className="typo-row">
//               <span className="typo-label">11px</span>
//               <span className="typo-sample" style={{ fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LABEL &mdash; UPPERCASE TRACKED</span>
//             </div>
//           </div>

//           <div>
//             <div className="tokens-subtitle">Border Radius</div>
//             <div className="radius-chips">
//               <div style={{ textAlign: 'center' }}>
//                 <div className="radius-chip" style={{ borderRadius: '4px' }}>4px</div>
//                 <div className="radius-label">xs</div>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <div className="radius-chip" style={{ borderRadius: '8px' }}>8px</div>
//                 <div className="radius-label">sm</div>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <div className="radius-chip" style={{ borderRadius: '14px' }}>14px</div>
//                 <div className="radius-label">md</div>
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <div className="radius-chip" style={{ borderRadius: '50%' }}>50%</div>
//                 <div className="radius-label">full</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default DesignSystem;
