import { ReactNode } from "react";

type LayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <main className="main-panel">{children}</main>
    </div>
  );
}
