import { useTranslation } from 'react-i18next';

/**
 * Hook to get translated content based on current language
 * Falls back to Turkish if the target language content is missing
 * 
 * @param item - Object containing both language versions (e.g., { title, titleTr })
 * @param field - Base field name (e.g., 'title', 'description', 'name')
 * @returns The appropriate language version of the content
 * 
 * Usage:
 * const title = useTranslatedContent(campaign, 'title');
 * const description = useTranslatedContent(product, 'description');
 */
export function useTranslatedContent<T extends Record<string, any>>(
    item: T | null | undefined,
    field: string
): string {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    if (!item) return '';

    // Get field names
    const trField = `${field}Tr`;
    const enField = field;

    // Turkish: prefer titleTr, fallback to title
    if (currentLanguage === 'tr') {
        return item[trField] || item[enField] || '';
    }

    // English (or other): prefer title, fallback to titleTr
    return item[enField] || item[trField] || '';
}

/**
 * Utility function for inline use without hook (for components that don't use hooks)
 * Pass the current language directly
 */
export function getTranslatedContent<T extends Record<string, any>>(
    item: T | null | undefined,
    field: string,
    language: string
): string {
    if (!item) return '';

    const trField = `${field}Tr`;
    const enField = field;

    if (language === 'tr') {
        return item[trField] || item[enField] || '';
    }

    return item[enField] || item[trField] || '';
}

export default useTranslatedContent;
