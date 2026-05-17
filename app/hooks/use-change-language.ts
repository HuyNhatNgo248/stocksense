import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";

export function useChangeLanguage() {
  const { i18n } = useTranslation();
  const fetcher = useFetcher();

  return useCallback(
    (lang: string) => {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      fetcher.submit(
        { lang },
        { method: "post", action: "/app/set-language" },
      );
    },
    [i18n, fetcher],
  );
}
