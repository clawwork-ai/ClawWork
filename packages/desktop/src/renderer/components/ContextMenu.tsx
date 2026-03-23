import { useState, useCallback, useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { TaskStatus } from '@clawwork/shared';
import { cn } from '@/lib/utils';
import i18n from '../i18n';

export interface MenuItem {
  label: string;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface MenuState {
  isOpen: boolean;
  taskId: string;
  taskStatus: TaskStatus;
}

const INITIAL_STATE: MenuState = {
  isOpen: false,
  taskId: '',
  taskStatus: 'active',
};

export interface SessionActions {
  rename: (taskId: string) => void;
  compact: (taskId: string) => void;
  reset: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  isConnected: (taskId: string) => boolean;
}

export function useTaskContextMenu(
  updateStatus: (id: string, status: TaskStatus) => void,
  sessionActions?: SessionActions,
) {
  const [state, setState] = useState<MenuState>(INITIAL_STATE);

  const openMenu = useCallback((e: MouseEvent, taskId: string, taskStatus: TaskStatus) => {
    e.preventDefault();
    setState({ isOpen: true, taskId, taskStatus });
  }, []);

  const closeMenu = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const items: MenuItem[] = [];
  const connected = state.isOpen && sessionActions ? sessionActions.isConnected(state.taskId) : false;

  if (sessionActions) {
    items.push({
      label: i18n.t('contextMenu.rename'),
      action: () => sessionActions.rename(state.taskId),
    });
  }

  if (state.taskStatus === 'active') {
    items.push({
      label: i18n.t('contextMenu.markCompleted'),
      action: () => updateStatus(state.taskId, 'completed'),
    });
  } else if (state.taskStatus === 'completed') {
    items.push({
      label: i18n.t('contextMenu.reactivate'),
      action: () => updateStatus(state.taskId, 'active'),
    });
  }

  if (sessionActions) {
    items.push({
      label: i18n.t('contextMenu.compactSession'),
      action: () => sessionActions.compact(state.taskId),
      disabled: !connected,
    });
    items.push({
      label: i18n.t('contextMenu.resetSession'),
      action: () => sessionActions.reset(state.taskId),
      disabled: !connected,
    });
    items.push({
      label: i18n.t('contextMenu.deleteTask'),
      action: () => sessionActions.deleteTask(state.taskId),
      danger: true,
    });
  }

  if (state.taskStatus === 'active' || state.taskStatus === 'completed') {
    items.push({
      label: i18n.t('contextMenu.archive'),
      action: () => updateStatus(state.taskId, 'archived'),
      danger: true,
    });
  }

  return {
    items,
    taskId: state.taskId,
    taskStatus: state.taskStatus,
    isOpen: state.isOpen,
    openMenu,
    closeMenu,
  };
}

interface TaskContextMenuPopoverProps {
  open: boolean;
  position: { x: number; y: number } | null;
  items: MenuItem[];
  onClose: () => void;
}

const VIEWPORT_PADDING = 8;

export function TaskContextMenuPopover({ open, position, items, onClose }: TaskContextMenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !position) {
      setClamped(null);
      return;
    }
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const x = Math.min(position.x, window.innerWidth - width - VIEWPORT_PADDING);
    const y = Math.min(position.y, window.innerHeight - height - VIEWPORT_PADDING);
    setClamped({ x: Math.max(VIEWPORT_PADDING, x), y: Math.max(VIEWPORT_PADDING, y) });
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    const handleDown = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const el = menuRef.current;
      if (!el) return;
      const focusable = Array.from(el.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      if (focusable.length === 0) return;
      const active = document.activeElement as HTMLElement;
      const idx = focusable.indexOf(active as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusable[(idx + 1) % focusable.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusable[(idx - 1 + focusable.length) % focusable.length].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusable[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        focusable[focusable.length - 1].focus();
      }
    };
    const dismiss = () => onClose();

    document.addEventListener('mousedown', handleDown, true);
    document.addEventListener('keydown', handleKey, true);
    window.addEventListener('blur', dismiss);
    window.addEventListener('resize', dismiss);
    document.addEventListener('contextmenu', dismiss, true);

    return () => {
      document.removeEventListener('mousedown', handleDown, true);
      document.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('blur', dismiss);
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('contextmenu', dismiss, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const el = menuRef.current;
      if (!el) return;
      const first = el.querySelector<HTMLButtonElement>('button:not(:disabled)');
      first?.focus();
    });
  }, [open]);

  if (!open || !position) return null;

  const pos = clamped ?? position;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ position: 'fixed', left: pos.x, top: pos.y }}
      className="z-50 min-w-[8rem] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1 text-[var(--text-primary)] shadow-[var(--shadow-elevated)] animate-in fade-in-0 zoom-in-95"
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          tabIndex={-1}
          disabled={item.disabled}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={cn(
            'relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
            'hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
            'focus-visible:bg-[var(--bg-hover)] focus-visible:text-[var(--text-primary)] focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-50',
            item.danger
              ? 'text-[var(--danger)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger)] focus-visible:bg-[var(--danger-bg)] focus-visible:text-[var(--danger)]'
              : 'text-[var(--text-secondary)]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
