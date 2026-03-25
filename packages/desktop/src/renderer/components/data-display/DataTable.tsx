import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { DataColumnKind } from '@/lib/ui-contract';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  kind: DataColumnKind;
  width?: string;
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  rowClassName?: (row: T, index: number) => string | undefined;
  onRowClick?: (row: T, index: number) => void;
  expandedRowRender?: (row: T, index: number) => ReactNode;
  isRowExpanded?: (row: T, index: number) => boolean;
  empty?: ReactNode;
}

function cellAlignment(kind: DataColumnKind) {
  if (kind === 'numeric' || kind === 'action') return 'text-right';
  if (kind === 'status') return 'text-left';
  return 'text-left';
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  rowClassName,
  onRowClick,
  expandedRowRender,
  isRowExpanded,
  empty,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <table className="w-full table-fixed">
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={column.width ? { width: column.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr className="border-b border-[var(--border)]">
          {columns.map((column) => (
            <th
              key={column.key}
              className={cn(
                'px-3 py-2 type-meta text-[var(--text-muted)]',
                cellAlignment(column.kind),
                column.className,
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <Fragment key={getRowKey(row, index)}>
            <tr
              className={cn(
                'border-b border-[var(--border)] align-top',
                onRowClick && 'cursor-pointer transition-colors hover:bg-[var(--state-hover)]',
                rowClassName?.(row, index),
              )}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-3 py-[var(--density-table-row-padding-y)] text-sm text-[var(--text-secondary)]',
                    cellAlignment(column.kind),
                    column.className,
                  )}
                >
                  {column.render(row, index)}
                </td>
              ))}
            </tr>
            {expandedRowRender && isRowExpanded?.(row, index) ? (
              <tr className="border-b border-[var(--border)]">
                <td colSpan={columns.length} className="px-3 py-0">
                  {expandedRowRender(row, index)}
                </td>
              </tr>
            ) : null}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
