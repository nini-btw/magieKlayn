import createMiddleware from 'next-intl/middleware';
import { i18nConfig } from '../../i18n.config';

export default createMiddleware(i18nConfig);
