// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DataTable, { type DataTableColumn } from '../src/renderer/components/data-display/DataTable';

function render(element: React.ReactElement): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('data table', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('applies semantic alignment by column kind', () => {
    const columns: DataTableColumn<{ name: string; value: number }>[] = [
      {
        key: 'name',
        header: 'Name',
        kind: 'text',
        render: (row) => row.name,
      },
      {
        key: 'value',
        header: 'Value',
        kind: 'numeric',
        render: (row) => row.value,
      },
    ];

    const { container, unmount } = render(
      <DataTable columns={columns} rows={[{ name: 'Alpha', value: 42 }]} getRowKey={(row) => row.name} />,
    );

    const headerCells = [...container.querySelectorAll('th')];
    const bodyCells = [...container.querySelectorAll('tbody td')];

    expect(headerCells[0].className).toContain('text-left');
    expect(headerCells[1].className).toContain('text-right');
    expect(bodyCells[0].className).toContain('text-left');
    expect(bodyCells[1].className).toContain('text-right');

    unmount();
  });
});
