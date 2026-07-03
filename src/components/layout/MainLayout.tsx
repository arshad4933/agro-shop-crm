import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function MainLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-slate-100">
      {children}
    </main>
  );
}