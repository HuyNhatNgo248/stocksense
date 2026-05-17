import * as i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const LANG_STORAGE_KEY = "stocksense_lang";
const DEFAULT_LANG = "ja";

const savedLang =
  typeof window !== "undefined"
    ? (localStorage.getItem(LANG_STORAGE_KEY) ?? DEFAULT_LANG)
    : DEFAULT_LANG;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: savedLang,
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

export default i18n;
