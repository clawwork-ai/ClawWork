import { useState, useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useUiStore } from '../../stores/uiStore';
import {
  filterSlashCommands,
  getChoiceOptions,
  getCommandsForGateway,
  hasArgPicker,
  parseSlashQuery,
  type SlashCommandView,
} from '@/lib/slash-commands';
import type { ArgOption } from '../SlashArgPicker';

interface UseSlashAutocompleteOpts {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function useSlashAutocomplete(opts: UseSlashAutocompleteOpts) {
  const { textareaRef } = opts;

  const activeGatewayId = useTaskStore((s) => {
    const id = s.activeTaskId;
    const task = id ? s.tasks.find((t) => t.id === id) : undefined;
    return task?.gatewayId ?? s.pendingNewTask?.gatewayId ?? null;
  });
  const commandCatalog = useUiStore((s) => (activeGatewayId ? s.commandCatalogByGateway[activeGatewayId] : undefined));
  const allCommands = useMemo(() => getCommandsForGateway(commandCatalog), [commandCatalog]);

  const [slashMenuVisible, setSlashMenuVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const slashCommands = useMemo(() => filterSlashCommands(slashQuery, allCommands), [slashQuery, allCommands]);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [argPickerVisible, setArgPickerVisible] = useState(false);
  const [argPickerCommand, setArgPickerCommand] = useState<SlashCommandView | null>(null);
  const [argPickerOptions, setArgPickerOptions] = useState<ArgOption[]>([]);
  const [argPickerIndex, setArgPickerIndex] = useState(0);

  const updateSlashMenu = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const result = parseSlashQuery(ta.value, ta.selectionStart ?? 0);
    if (result.active) {
      setSlashQuery(result.query);
      setSlashIndex(0);
      setSlashMenuVisible(true);
    } else {
      setSlashMenuVisible(false);
    }
  }, [textareaRef]);

  const buildArgOptions = useCallback((cmd: SlashCommandView): ArgOption[] => {
    if (cmd.pickerType === 'model') {
      const gwId =
        useTaskStore.getState().tasks.find((t) => t.id === useTaskStore.getState().activeTaskId)?.gatewayId ??
        useTaskStore.getState().pendingNewTask?.gatewayId;
      const catalog = gwId ? (useUiStore.getState().modelCatalogByGateway[gwId] ?? []) : [];
      return catalog.map((m) => ({
        value: m.id,
        label: m.name ?? m.id,
        detail: m.provider,
      }));
    }
    const choices = getChoiceOptions(cmd);
    if (choices) return choices.map((c) => ({ value: c.value, label: c.label }));
    return [];
  }, []);

  const commitSlashCommand = useCallback(
    (cmd: SlashCommandView) => {
      const ta = textareaRef.current;
      if (!ta) return;
      setSlashMenuVisible(false);
      setSlashQuery('');
      setSlashIndex(0);

      const newValue = `/${cmd.name} `;
      ta.value = newValue;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      ta.setSelectionRange(newValue.length, newValue.length);
      ta.focus();

      if (hasArgPicker(cmd)) {
        setArgPickerCommand(cmd);
        setArgPickerOptions(buildArgOptions(cmd));
        setArgPickerIndex(0);
        setArgPickerVisible(true);
      }
    },
    [textareaRef, buildArgOptions],
  );

  const commitArgOption = useCallback(
    (opt: ArgOption) => {
      const ta = textareaRef.current;
      if (!ta || !argPickerCommand) return;
      const newValue = `/${argPickerCommand.name} ${opt.value}`;
      ta.value = newValue;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      ta.setSelectionRange(newValue.length, newValue.length);
      ta.focus();
      setArgPickerVisible(false);
      setArgPickerCommand(null);
      setArgPickerOptions([]);
      setArgPickerIndex(0);
    },
    [textareaRef, argPickerCommand],
  );

  const closeArgPicker = useCallback(() => {
    setArgPickerVisible(false);
    setArgPickerCommand(null);
    setArgPickerOptions([]);
    setArgPickerIndex(0);
    textareaRef.current?.focus();
  }, [textareaRef]);

  const argPickerIndexRef = useRef(argPickerIndex);
  argPickerIndexRef.current = argPickerIndex;
  const argPickerOptionsRef = useRef(argPickerOptions);
  argPickerOptionsRef.current = argPickerOptions;

  useEffect(() => {
    if (!argPickerVisible) return;
    const raf = requestAnimationFrame(() => textareaRef.current?.focus());
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (document.activeElement === textareaRef.current) return;
      const opts = argPickerOptionsRef.current;
      if (opts.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setArgPickerIndex((i) => (i + 1) % opts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setArgPickerIndex((i) => (i - 1 + opts.length) % opts.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const opt = opts[argPickerIndexRef.current];
        if (opt) commitArgOption(opt);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeArgPicker();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [argPickerVisible, commitArgOption, closeArgPicker, textareaRef]);

  return {
    slashMenuVisible,
    setSlashMenuVisible,
    slashQuery,
    slashIndex,
    setSlashIndex,
    slashCommands,
    allCommands,
    dashboardOpen,
    setDashboardOpen,
    argPickerVisible,
    argPickerCommand,
    argPickerOptions,
    argPickerIndex,
    setArgPickerIndex,
    updateSlashMenu,
    commitSlashCommand,
    commitArgOption,
    closeArgPicker,
  };
}
