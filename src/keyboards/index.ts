import { InlineKeyboard } from "grammy";
import { ServiceOption, PaymentOption, LanguageOption } from "../types";
import {
  getTranslation,
  TranslationKey,
  TRANSLATION_KEYS,
} from "../translations";

// Cache for keyboard layouts
const keyboardCache = new Map<string, InlineKeyboard>();

// Helper function to create a cached keyboard
function createCachedKeyboard(
  key: string,
  factory: () => InlineKeyboard
): InlineKeyboard {
  if (!keyboardCache.has(key)) {
    keyboardCache.set(key, factory());
  }
  return keyboardCache.get(key)!;
}

// Clear keyboard cache
export function clearKeyboardCache(): void {
  keyboardCache.clear();
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "en", label: "English", emoji: "🇬🇧", manager: "Jacob" },
  { id: "de", label: "German", emoji: "🇩🇪", manager: "Jacob" },
  { id: "es", label: "Spanish", emoji: "🇪🇸", manager: "Jacob" },
  { id: "ru", label: "Russian", emoji: "🇷🇺", manager: "Vladislav" },
  { id: "uk", label: "Ukrainian", emoji: "🇺🇦", manager: "Vladislav" },
];

export const SERVICE_OPTIONS: ServiceOption[] = [
  { id: "video_call", label: "Video Call", emoji: "📹" },
  { id: "tuning", label: "Tuning", emoji: "🔧" },
  { id: "customs", label: "Customs Declaration", emoji: "🏛" },
  { id: "logistics", label: "Logistics", emoji: "🚛" },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "eur", label: "EUR", emoji: "💶" },
  { id: "usd", label: "USD", emoji: "💵" },
  { id: "crypto", label: "Cryptocurrency", emoji: "₿" },
];

export function createLanguageKeyboard(): InlineKeyboard {
  return createCachedKeyboard("language", () => {
    const keyboard = new InlineKeyboard();
    LANGUAGE_OPTIONS.forEach((option, index) => {
      keyboard.text(`${option.emoji} ${option.label}`, `lang_${option.id}`);
      if (index % 2 === 1) keyboard.row();
    });
    return keyboard;
  });
}

export function createServicesKeyboard(
  selectedServices: Set<string>,
  language: string = "en"
): InlineKeyboard {
  const cacheKey = `services_${language}_${Array.from(selectedServices)
    .sort()
    .join(",")}`;
  return createCachedKeyboard(cacheKey, () => {
    const keyboard = new InlineKeyboard();

    SERVICE_OPTIONS.forEach((option) => {
      const isSelected = selectedServices.has(option.id);
      const translationKey = `buttons.services.${option.id}` as TranslationKey;
      const buttonText = `${isSelected ? "✅ " : ""}${
        option.emoji
      } ${getTranslation(language, translationKey)}`;
      keyboard.text(buttonText, `toggle_${option.id}`).row();
    });

    keyboard
      .text(
        getTranslation(
          language,
          `buttons.${TRANSLATION_KEYS.buttons.confirm}` as TranslationKey
        ),
        "confirm_services"
      )
      .row();

    keyboard.text(
      getTranslation(
        language,
        `buttons.${TRANSLATION_KEYS.buttons.back}` as TranslationKey
      ),
      "back_to_car_request"
    );

    return keyboard;
  });
}

export function createPaymentKeyboard(language: string = "en"): InlineKeyboard {
  return createCachedKeyboard(`payment_${language}`, () => {
    const keyboard = new InlineKeyboard();

    PAYMENT_OPTIONS.forEach((option, index) => {
      const translationKey = `buttons.payment.${option.id}` as TranslationKey;
      keyboard.text(
        `${option.emoji} ${getTranslation(language, translationKey)}`,
        `payment_${option.id}`
      );
      if (index % 2 === 1) keyboard.row();
    });

    keyboard
      .text(
        getTranslation(
          language,
          `buttons.${TRANSLATION_KEYS.buttons.back}` as TranslationKey
        ),
        "back_to_services"
      )
      .row();

    return keyboard;
  });
}

export function createManagerKeyboard(
  manager: string,
  language: string = "en"
): InlineKeyboard {
  const cacheKey = `manager_${manager}_${language}`;
  return createCachedKeyboard(cacheKey, () => {
    const keyboard = new InlineKeyboard();

    if (manager === "Jacob") {
      keyboard.url(
        getTranslation(
          language,
          `buttons.${TRANSLATION_KEYS.buttons.connect}` as TranslationKey,
          { manager }
        ),
        "@GHub_International_Jakob"
      );
    } else if (manager === "Vladislav") {
      keyboard.url(
        getTranslation(
          language,
          `buttons.${TRANSLATION_KEYS.buttons.connect}` as TranslationKey,
          { manager }
        ),
        "https://t.me/Vlad_GHub_International"
      );
    }

    return keyboard;
  });
}
