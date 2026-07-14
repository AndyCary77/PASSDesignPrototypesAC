/// <reference types="vite/client" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*/SideNav.jsx' {
  import { ComponentType } from 'react';
  const SideNav: ComponentType<{ onSelectItem?: (key: string) => void; appName?: string; officeName?: string; officeAddress?: string; defaultCollapsed?: boolean }>;
  export default SideNav;
}

declare module '*/TopNav.jsx' {
  import { ComponentType } from 'react';
  const TopNav: ComponentType<{ activeItem?: string; unreadMessages?: number; onLogout?: () => void; userName?: string; userAvatar?: string; appName?: string }>;
  export default TopNav;
}
