import { useEffect } from 'react';

const SITE_NAME = 'Google Phone Gallery';

/** Gives each page its own title, so screen reader users and browser tabs can tell pages apart. */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;
  }, [pageTitle]);
}
