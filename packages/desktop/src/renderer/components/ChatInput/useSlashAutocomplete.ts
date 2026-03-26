import { useState, useCallback, type RefObject } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useUiStore } from '../../stores/uiStore';
import {
  filterSlashCommands,
  parseSlashQuery,
  getEnumOptions,
  hasArgPicker,
  type SlashCommand,
} from '@/lib/slash-commands';
import type { ArgOption } from '../SlashArgPicker';

interface UseSlashAutocompleteOpts {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function useSlashAutocomplete(opts: UseSlashAutocompleteOpts) {
  const { textareaRef } = opts;

  const [slashMenuVisible, setSlashMenuVisible] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);
  const slashCommands = filterSlashCommands(slashQuery);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const [argPickerVisible, setArgPickerVisible] = useState(false);
  const [argPickerCommand, setArgPickerCommand] = useState<SlashCommand | null>(null);
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

  const buildArgOptions = useCallback((cmd: SlashCommand): ArgOption[] => {
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
    const enumOpts = getEnumOptions(cmd);
    if (enumOpts) return enumOpts.map((v) => ({ value: v, label: v }));
    return [];
  }, []);

  const commitSlashCommand = useCallback(
    (cmd: SlashCommand) => {
      const ta = textareaRef.current;
      if (!ta) return;
      setSlashMenuVisible(false);
      setSlashQuery('');
      setSlashIndex(0);

      if (hasArgPicker(cmd)) {
        const newValue = `/${cmd.name} `;
        ta.value = newValue;
        ta.style.height = 'auto';
        ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
        ta.setSelectionRange(newValue.length, newValue.length);
        ta.focus();
        setArgPickerCommand(cmd);
        setArgPickerOptions(buildArgOptions(cmd));
        setArgPickerIndex(0);
        setArgPickerVisible(true);
        return;
      }

      const newValue = `/${cmd.name} `;
      ta.value = newValue;
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
      ta.setSelectionRange(newValue.length, newValue.length);
      ta.focus();
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

  return {
    slashMenuVisible,
    setSlashMenuVisible,
    slashQuery,
    slashIndex,
    setSlashIndex,
    slashCommands,
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
