// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../src/renderer/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../src/renderer/components/ui/tabs';
import { Button } from '../src/renderer/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../src/renderer/components/ui/dialog';
import PanelHeader from '../src/renderer/components/semantic/PanelHeader';
import SettingRow from '../src/renderer/components/semantic/SettingRow';
import ListItem from '../src/renderer/components/semantic/ListItem';
import StatusTag from '../src/renderer/components/semantic/StatusTag';

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

function findByText(scope: ParentNode, text: string): HTMLElement | undefined {
  return [...scope.querySelectorAll<HTMLElement>('*')].find((node) => node.textContent === text);
}

describe('typography contract', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders semantic component roles', () => {
    const { container, unmount } = render(
      <div>
        <PanelHeader title="Header" subtitle="Subtitle" />
        <SettingRow label="Label" description="Description" />
        <ListItem title="Title" subtitle="Subtitle" meta="Meta" />
        <StatusTag tone="accent">Ready</StatusTag>
      </div>,
    );

    const headerTitle = findByText(container, 'Header');
    const headerSubtitle = findByText(container, 'Subtitle');
    const settingLabel = findByText(container, 'Label');
    const settingDescription = findByText(container, 'Description');
    const listTitle = findByText(container, 'Title');
    const listMeta = findByText(container, 'Meta');
    const status = findByText(container, 'Ready');

    expect(headerTitle?.className).toContain('type-section-title');
    expect(headerSubtitle?.className).toContain('type-support');
    expect(settingLabel?.className).toContain('type-label');
    expect(settingDescription?.className).toContain('type-support');
    expect(listTitle?.className).toContain('type-label');
    expect(listMeta?.className).toContain('type-meta');
    expect(status?.className).toContain('type-badge');

    unmount();
  });

  it('renders primitive roles', () => {
    const { container, unmount } = render(
      <div>
        <Button>Submit</Button>
        <Tabs defaultValue="alpha">
          <TabsList>
            <TabsTrigger value="alpha">Alpha</TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu open>
          <DropdownMenuTrigger asChild>
            <button type="button">Open</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Group</DropdownMenuLabel>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      </div>,
    );

    const button = findByText(container, 'Submit');
    const tab = container.querySelector<HTMLElement>('[role="tab"]');
    const dialogTitle = findByText(document.body, 'Dialog title');
    const dialogDescription = findByText(document.body, 'Dialog description');
    const menuLabel = findByText(document.body, 'Group');
    const menuItem = findByText(document.body, 'Item');
    expect(button?.className).toContain('type-label');
    expect(tab?.className ?? '').toContain('type-label');
    expect(dialogTitle?.className ?? '').toContain('type-dialog-title');
    expect(dialogDescription?.className).toContain('type-support');
    expect(menuLabel?.className).toContain('type-meta');
    expect(menuItem?.className).toContain('type-body');

    unmount();
  });

  it('renders code and page-title roles', () => {
    const { container, unmount } = render(
      <div>
        <h1 className="type-page-title">Page</h1>
        <code className="type-code-inline">inline</code>
        <pre className="type-code-block">block</pre>
      </div>,
    );
    expect(findByText(container, 'Page')?.className).toContain('type-page-title');
    expect(findByText(container, 'inline')?.className).toContain('type-code-inline');
    expect(findByText(container, 'block')?.className).toContain('type-code-block');
    unmount();
  });
});
