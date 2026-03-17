import type { ReactNode } from 'react';

export default function SettingRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0 mr-4">
        {typeof label === 'string' ? <span className="text-sm text-[var(--text-primary)]">{label}</span> : label}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
