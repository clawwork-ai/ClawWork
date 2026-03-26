import { defineAppSetup } from '@slidev/types';
import { t } from '../composables/i18n';

export default defineAppSetup(({ app }) => {
  app.config.globalProperties.$t = t;
});
