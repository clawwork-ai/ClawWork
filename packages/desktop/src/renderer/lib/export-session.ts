import { toast } from 'sonner';
import i18n from '../i18n';

export function exportToFiles(taskId: string): void {
  window.clawwork
    .exportSessionMarkdown(taskId)
    .then((res) => {
      if (res.ok) toast.success(i18n.t('export.exportedToFiles'));
    })
    .catch(() => {});
}

export function exportToLocal(taskId: string): void {
  window.clawwork.exportSessionMarkdownAs(taskId).catch(() => {});
}
