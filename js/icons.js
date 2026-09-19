// Reusable inline SVG icons, matched to the mockups' thin-line style.
// All use currentColor so CSS controls fill/stroke color per context.

export const ICON = {
  check: `<svg class="icon" viewBox="0 0 16 16" width="12" height="12"><path d="M2.5 8.5 L6 12 L13.5 3.5" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  checkWhite: `<svg class="icon" viewBox="0 0 16 16" width="12" height="12"><path d="M2.5 8.5 L6 12 L13.5 3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  home: `<svg class="icon" viewBox="0 0 24 24" width="22" height="22"><path d="M4 12 L12 4 L20 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10 L6 20 L18 20 L18 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  menu: `<svg class="icon" viewBox="0 0 24 24" width="22" height="22"><line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,

  chevronLeft: `<svg class="icon" viewBox="0 0 24 24" width="20" height="20"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevronRight: `<svg class="icon" viewBox="0 0 24 24" width="20" height="20"><path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevronDown: `<svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M5 9 L12 16 L19 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevronSmall: `<svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M9 6 L15 12 L9 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  close: `<svg class="icon" viewBox="0 0 24 24" width="18" height="18"><path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  plusCircleSm: `<svg class="icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8 L12 16 M8 12 L16 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  plusCircleLg: `<svg class="icon" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7 L12 17 M7 12 L17 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  trash: `<svg class="icon" viewBox="0 0 24 24" width="15" height="15"><path d="M5 7 L19 7 M9 7 L9 5 Q9 4 10 4 L14 4 Q15 4 15 5 L15 7 M7 7 L7.8 19 Q7.9 20 9 20 L15 20 Q16.1 20 16.2 19 L17 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  alertCircle: `<svg class="icon" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="7" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor"/></svg>`,

  download: `<svg class="icon" viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M12 7 L12 15 M8 12 L12 16 L16 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  downloadSm: `<svg class="icon" viewBox="0 0 24 24" width="13" height="13"><path d="M12 5 L12 13 M8 10 L12 14 L16 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  calendarIcon: `<svg class="icon" viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="1.6"/><line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  dumbbellIcon: `<svg class="icon" viewBox="0 0 24 24" width="22" height="22"><rect x="2" y="9" width="4" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="18" y="9" width="4" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1.6"/></svg>`,

  pulseIcon: `<svg class="icon" viewBox="0 0 24 24" width="22" height="22"><circle cx="16" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 17 L8 17 L10 12 L14 20 L16 13 L18 17 L22 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  emptyBoxIcon: `<svg class="icon" viewBox="0 0 24 24" width="26" height="26"><rect x="4" y="7" width="16" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="4" x2="9" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="15" y1="4" x2="15" y2="9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  emptyReportIcon: `<svg class="icon" viewBox="0 0 24 24" width="30" height="30"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.6"/><line x1="8" y1="2" x2="8" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="16" y1="2" x2="16" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="8" y1="14" x2="10" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="14" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};
