import { LanguageOption } from "../types";

// Define translation keys as a const to ensure type safety
export const TRANSLATION_KEYS = {
  welcome: "welcome",
  selectLanguage: "selectLanguage",
  carRequest: "carRequest",
  serviceSelection: "serviceSelection",
  serviceSelectionTitle: "serviceSelectionTitle",
  paymentSelection: "paymentSelection",
  summary: "summary",
  managerInfo: "managerInfo",
  selectService: "selectService",
  choices: "choices",
  summaryDetails: "summaryDetails",
  noServicesSelected: "noServicesSelected",
  pleaseUseKeyboard: "pleaseUseKeyboard",
  askManagerMessage: "askManagerMessage",
  buttons: {
    confirm: "confirm",
    connect: "connect",
    back: "back",
    services: {
      video_call: "video_call",
      tuning: "tuning",
      customs: "customs",
      logistics: "logistics",
    },
    payment: {
      eur: "eur",
      usd: "usd",
      crypto: "crypto",
    },
  },
} as const;

// Define the type for translation keys
export type TranslationKey =
  | (typeof TRANSLATION_KEYS)[keyof Omit<typeof TRANSLATION_KEYS, "buttons">]
  | `buttons.${(typeof TRANSLATION_KEYS.buttons)[keyof Omit<
      typeof TRANSLATION_KEYS.buttons,
      "services" | "payment"
    >]}`
  | `buttons.services.${(typeof TRANSLATION_KEYS.buttons.services)[keyof typeof TRANSLATION_KEYS.buttons.services]}`
  | `buttons.payment.${(typeof TRANSLATION_KEYS.buttons.payment)[keyof typeof TRANSLATION_KEYS.buttons.payment]}`;

export interface Translation {
  [TRANSLATION_KEYS.welcome]: string;
  [TRANSLATION_KEYS.selectLanguage]: string;
  [TRANSLATION_KEYS.carRequest]: string;
  [TRANSLATION_KEYS.serviceSelection]: string;
  [TRANSLATION_KEYS.serviceSelectionTitle]: string;
  [TRANSLATION_KEYS.paymentSelection]: string;
  [TRANSLATION_KEYS.summary]: string;
  [TRANSLATION_KEYS.managerInfo]: string;
  [TRANSLATION_KEYS.selectService]: string;
  [TRANSLATION_KEYS.choices]: string;
  [TRANSLATION_KEYS.summaryDetails]: string;
  [TRANSLATION_KEYS.noServicesSelected]: string;
  [TRANSLATION_KEYS.pleaseUseKeyboard]: string;
  [TRANSLATION_KEYS.askManagerMessage]: string;
  buttons: {
    [TRANSLATION_KEYS.buttons.confirm]: string;
    [TRANSLATION_KEYS.buttons.connect]: string;
    [TRANSLATION_KEYS.buttons.back]: string;
    services: {
      [TRANSLATION_KEYS.buttons.services.video_call]: string;
      [TRANSLATION_KEYS.buttons.services.tuning]: string;
      [TRANSLATION_KEYS.buttons.services.customs]: string;
      [TRANSLATION_KEYS.buttons.services.logistics]: string;
    };
    payment: {
      [TRANSLATION_KEYS.buttons.payment.eur]: string;
      [TRANSLATION_KEYS.buttons.payment.usd]: string;
      [TRANSLATION_KEYS.buttons.payment.crypto]: string;
    };
  };
}

// Cache for compiled translations
const translationCache = new Map<string, Map<string, string>>();

// Compile translation with parameters
function compileTranslation(
  text: string,
  params: Record<string, string>
): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
}

// Get translation with caching
export function getTranslation(
  language: string,
  key: TranslationKey,
  params: Record<string, string> = {}
): string {
  const translation = translations[language] || translations["en"];
  let text: string;

  // Check cache first
  const cacheKey = `${language}:${key}`;
  const languageCache = translationCache.get(language) || new Map();
  const cachedText = languageCache.get(cacheKey);
  if (cachedText) {
    return compileTranslation(cachedText, params);
  }

  // Get text from translation
  if (key.startsWith("buttons.")) {
    const parts = key.split(".");
    if (parts.length === 3) {
      const [_, category, subKey] = parts;
      if (category === "services") {
        text =
          translation.buttons.services[
            subKey as keyof Translation["buttons"]["services"]
          ];
      } else if (category === "payment") {
        text =
          translation.buttons.payment[
            subKey as keyof Translation["buttons"]["payment"]
          ];
      } else {
        text =
          translation.buttons[
            category as keyof Omit<
              Translation["buttons"],
              "services" | "payment"
            >
          ];
      }
    } else {
      const buttonKey = parts[1] as keyof Omit<
        Translation["buttons"],
        "services" | "payment"
      >;
      text = translation.buttons[buttonKey];
    }
  } else {
    text = translation[key as keyof Omit<Translation, "buttons">];
  }

  // Cache the compiled text
  languageCache.set(cacheKey, text);
  translationCache.set(language, languageCache);

  return compileTranslation(text, params);
}

// Clear translation cache
export function clearTranslationCache(): void {
  translationCache.clear();
}

export const translations: Record<string, Translation> = {
  en: {
    [TRANSLATION_KEYS.welcome]: `👋 Hello, welcome to G-Hub International! Thank you for contacting us.  
🚗 We specialize in selling brand-new luxury vehicles with worldwide delivery, managing the entire process.`,
    [TRANSLATION_KEYS.selectLanguage]: `🌐 Which language would you prefer to use?`,
    [TRANSLATION_KEYS.carRequest]: `🔎 Which specific vehicle are you interested in? Please enter the model and color.`,
    [TRANSLATION_KEYS.serviceSelection]: `Great choice! Thank you!`,
    [TRANSLATION_KEYS.serviceSelectionTitle]: `👉 Select the services you are interested in:`,
    [TRANSLATION_KEYS.paymentSelection]: `💳 Which payment method would you prefer?`,
    [TRANSLATION_KEYS.summary]: `Your selections:\n\nVehicle: {vehicle}\nServices: {services}\nPayment Method: {payment}`,
    [TRANSLATION_KEYS.managerInfo]: `Your sales representative: {manager}`,
    [TRANSLATION_KEYS.selectService]: `Please select at least one service.`,
    [TRANSLATION_KEYS.choices]: `✅ Your choices have been recorded:\n\nServices: {services}\nPayment Method: {payment}\n\nWe'll be in touch shortly!`,
    [TRANSLATION_KEYS.summaryDetails]: `Your choices:\n\nServices: {services}\nPayment Method: {payment}`,
    [TRANSLATION_KEYS.noServicesSelected]: `❌ No services selected. Please select at least one service to continue.`,
    [TRANSLATION_KEYS.pleaseUseKeyboard]: `⚠️ Please use the menu buttons to make your selection.`,
    [TRANSLATION_KEYS.askManagerMessage]:
      "You can ask all further questions to our manager. They will be happy to help you!",
    buttons: {
      [TRANSLATION_KEYS.buttons.confirm]: "Confirm Selection",
      [TRANSLATION_KEYS.buttons.connect]: "Connect with {manager}",
      [TRANSLATION_KEYS.buttons.back]: "Back",
      services: {
        [TRANSLATION_KEYS.buttons.services.video_call]: "Video Call",
        [TRANSLATION_KEYS.buttons.services.tuning]: "Tuning",
        [TRANSLATION_KEYS.buttons.services.customs]: "Customs Declaration",
        [TRANSLATION_KEYS.buttons.services.logistics]: "Logistics",
      },
      payment: {
        [TRANSLATION_KEYS.buttons.payment.eur]: "EUR",
        [TRANSLATION_KEYS.buttons.payment.usd]: "USD",
        [TRANSLATION_KEYS.buttons.payment.crypto]: "Cryptocurrency",
      },
    },
  },
  de: {
    [TRANSLATION_KEYS.welcome]: `👋 Hallo, willkommen bei G-Hub International! Vielen Dank für Ihre Kontaktaufnahme.
🚗 Wir sind spezialisiert auf den Verkauf neuer Luxusfahrzeuge mit weltweiter Lieferung und übernehmen den gesamten Prozess.`,
    [TRANSLATION_KEYS.selectLanguage]: `🌐 Welche Sprache möchtest du verwenden?`,
    [TRANSLATION_KEYS.carRequest]: `🔎 An welchem Fahrzeugmodell sind Sie interessiert? Bitte geben Sie das Modell und die Farbe ein.`,
    [TRANSLATION_KEYS.serviceSelection]: `Ausgezeichnete Wahl! Vielen Dank!`,
    [TRANSLATION_KEYS.serviceSelectionTitle]: `👉 Wählen Sie die gewünschten Dienstleistungen:`,
    [TRANSLATION_KEYS.paymentSelection]: `💳 Welche Zahlungsmethode bevorzugen Sie?`,
    [TRANSLATION_KEYS.summary]: `Ihre Auswahl:\n\nFahrzeug: {vehicle}\nDienstleistungen: {services}\nZahlungsmethode: {payment}`,
    [TRANSLATION_KEYS.managerInfo]: `Ihr Verkaufsvertreter: {manager}`,
    [TRANSLATION_KEYS.selectService]: `Bitte wählen Sie mindestens eine Dienstleistung aus.`,
    [TRANSLATION_KEYS.choices]: `✅ Ihre Auswahl wurde aufgezeichnet:\n\nDienstleistungen: {services}\nZahlungsmethode: {payment}\n\nWir melden uns in Kürze bei Ihnen!`,
    [TRANSLATION_KEYS.summaryDetails]: `Ihre Auswahl:\n\nDienstleistungen: {services}\nZahlungsmethode: {payment}`,
    [TRANSLATION_KEYS.noServicesSelected]: `❌ Keine Dienstleistungen ausgewählt. Bitte wählen Sie mindestens eine Dienstleistung aus, um fortzufahren.`,
    [TRANSLATION_KEYS.pleaseUseKeyboard]: `⚠️ Bitte verwenden Sie die Tastaturtasten für Ihre Auswahl.`,
    [TRANSLATION_KEYS.askManagerMessage]:
      "Alle weiteren Fragen können Sie unserem Manager stellen. Er wird Ihnen gerne helfen!",
    buttons: {
      [TRANSLATION_KEYS.buttons.confirm]: "Auswahl bestätigen",
      [TRANSLATION_KEYS.buttons.connect]: "Mit {manager} verbinden",
      [TRANSLATION_KEYS.buttons.back]: "Zurück",
      services: {
        [TRANSLATION_KEYS.buttons.services.video_call]: "Videogespräch",
        [TRANSLATION_KEYS.buttons.services.tuning]: "Tuning",
        [TRANSLATION_KEYS.buttons.services.customs]: "Zollabfertigung",
        [TRANSLATION_KEYS.buttons.services.logistics]: "Logistik",
      },
      payment: {
        [TRANSLATION_KEYS.buttons.payment.eur]: "EUR",
        [TRANSLATION_KEYS.buttons.payment.usd]: "USD",
        [TRANSLATION_KEYS.buttons.payment.crypto]: "Kryptowährung",
      },
    },
  },
  es: {
    [TRANSLATION_KEYS.welcome]: `👋 ¡Hola, bienvenido a G-Hub International! Gracias por contactarnos.
🚗 Nos especializamos en la venta de vehículos de lujo nuevos con entrega mundial, gestionando todo el proceso.`,
    [TRANSLATION_KEYS.selectLanguage]: `🌐 ¿Qué idioma prefieres usar?`,
    [TRANSLATION_KEYS.carRequest]: `🔎 ¿Qué vehículo específico le interesa? Por favor, ingrese el modelo y el color.`,
    [TRANSLATION_KEYS.serviceSelection]: `¡Excelente elección! ¡Gracias!`,
    [TRANSLATION_KEYS.serviceSelectionTitle]: `👉 Seleccione los servicios que le interesan:`,
    [TRANSLATION_KEYS.paymentSelection]: `💳 ¿Qué método de pago prefiere?`,
    [TRANSLATION_KEYS.summary]: `Sus selecciones:\n\nVehículo: {vehicle}\nServicios: {services}\nMétodo de pago: {payment}`,
    [TRANSLATION_KEYS.managerInfo]: `Su representante de ventas: {manager}`,
    [TRANSLATION_KEYS.selectService]: `Por favor, seleccione al menos un servicio.`,
    [TRANSLATION_KEYS.choices]: `✅ Sus elecciones han sido registradas:\n\nServicios: {services}\nMétodo de pago: {payment}\n\n¡Nos pondremos en contacto pronto!`,
    [TRANSLATION_KEYS.summaryDetails]: `Sus elecciones:\n\nServicios: {services}\nMétodo de pago: {payment}`,
    [TRANSLATION_KEYS.noServicesSelected]: `❌ No se han seleccionado servicios. Por favor, seleccione al menos un servicio para continuar.`,
    [TRANSLATION_KEYS.pleaseUseKeyboard]: `⚠️ Por favor, use los botones del teclado para hacer su selección.`,
    [TRANSLATION_KEYS.askManagerMessage]:
      "Puede hacer todas las preguntas adicionales a nuestro gerente. ¡Estará encantado de ayudarle!",
    buttons: {
      [TRANSLATION_KEYS.buttons.confirm]: "Confirmar selección",
      [TRANSLATION_KEYS.buttons.connect]: "Conectar con {manager}",
      [TRANSLATION_KEYS.buttons.back]: "Atrás",
      services: {
        [TRANSLATION_KEYS.buttons.services.video_call]: "Videollamada",
        [TRANSLATION_KEYS.buttons.services.tuning]: "Tuning",
        [TRANSLATION_KEYS.buttons.services.customs]: "Declaración de aduanas",
        [TRANSLATION_KEYS.buttons.services.logistics]: "Logística",
      },
      payment: {
        [TRANSLATION_KEYS.buttons.payment.eur]: "EUR",
        [TRANSLATION_KEYS.buttons.payment.usd]: "USD",
        [TRANSLATION_KEYS.buttons.payment.crypto]: "Criptomoneda",
      },
    },
  },
  ru: {
    [TRANSLATION_KEYS.welcome]: `👋 Здравствуйте, добро пожаловать в G-Hub International! Спасибо, что связались с нами.
🚗 Мы специализируемся на продаже новых люксовых автомобилей с доставкой по всему миру, управляя всем процессом.`,
    [TRANSLATION_KEYS.selectLanguage]: `🌐 Какой язык Вы предпочитаете использовать?`,
    [TRANSLATION_KEYS.carRequest]: `🔎 Какая конкретная модель автомобиля вас интересует? Пожалуйста, укажите модель и цвет.`,
    [TRANSLATION_KEYS.serviceSelection]: `Отличный выбор! Спасибо!`,
    [TRANSLATION_KEYS.serviceSelectionTitle]: `👉 Выберите интересующие вас услуги:`,
    [TRANSLATION_KEYS.paymentSelection]: `💳 Какой способ оплаты вы предпочитаете?`,
    [TRANSLATION_KEYS.summary]: `Ваш выбор:\n\nАвтомобиль: {vehicle}\nУслуги: {services}\nСпособ оплаты: {payment}`,
    [TRANSLATION_KEYS.managerInfo]: `Ваш представитель по продажам: {manager}`,
    [TRANSLATION_KEYS.selectService]: `Пожалуйста, выберите хотя бы одну услугу.`,
    [TRANSLATION_KEYS.choices]: `✅ Ваш выбор зафиксирован:\n\nУслуги: {services}\nСпособ оплаты: {payment}\n\nМы свяжемся с вами в ближайшее время!`,
    [TRANSLATION_KEYS.summaryDetails]: `Ваш выбор:\n\nУслуги: {services}\nСпособ оплаты: {payment}`,
    [TRANSLATION_KEYS.noServicesSelected]: `❌ Услуги не выбраны. Пожалуйста, выберите хотя бы одну услугу для продолжения.`,
    [TRANSLATION_KEYS.pleaseUseKeyboard]: `⚠️ Пожалуйста, используйте кнопки меню для выбора.`,
    [TRANSLATION_KEYS.askManagerMessage]:
      "Все дальнейшие вопросы вы можете задать нашему менеджеру. Он будет рад вам помочь!",
    buttons: {
      [TRANSLATION_KEYS.buttons.confirm]: "Подтвердить выбор",
      [TRANSLATION_KEYS.buttons.connect]: "Связаться с {manager}",
      [TRANSLATION_KEYS.buttons.back]: "Назад",
      services: {
        [TRANSLATION_KEYS.buttons.services.video_call]: "Видеозвонок",
        [TRANSLATION_KEYS.buttons.services.tuning]: "Тюнинг",
        [TRANSLATION_KEYS.buttons.services.customs]: "Таможенное оформление",
        [TRANSLATION_KEYS.buttons.services.logistics]: "Логистика",
      },
      payment: {
        [TRANSLATION_KEYS.buttons.payment.eur]: "EUR",
        [TRANSLATION_KEYS.buttons.payment.usd]: "USD",
        [TRANSLATION_KEYS.buttons.payment.crypto]: "Криптовалюта",
      },
    },
  },
  uk: {
    [TRANSLATION_KEYS.welcome]: `👋 Вітаємо у G-Hub International! Дякуємо, що зв'язалися з нами.
🚗 Ми спеціалізуємося на продажу нових люксових автомобілів з доставкою по всьому світу, керуючи всім процесом.`,
    [TRANSLATION_KEYS.selectLanguage]: `🌐 Яку мову ти волієш використовувати?`,
    [TRANSLATION_KEYS.carRequest]: `🔎 Яка конкретна модель автомобіля вас цікавить? Будь ласка, вкажіть модель та колір.`,
    [TRANSLATION_KEYS.serviceSelection]: `Чудовий вибір! Дякуємо!`,
    [TRANSLATION_KEYS.serviceSelectionTitle]: `👉 Виберіть цікаві для вас послуги:`,
    [TRANSLATION_KEYS.paymentSelection]: `💳 Який спосіб оплати ви віддаєте перевагу?`,
    [TRANSLATION_KEYS.summary]: `Ваш вибір:\n\nАвтомобіль: {vehicle}\nПослуги: {services}\nСпособ оплати: {payment}`,
    [TRANSLATION_KEYS.managerInfo]: `Ваш представник з продажів: {manager}`,
    [TRANSLATION_KEYS.selectService]: `Будь ласка, виберіть хоча б одну послугу.`,
    [TRANSLATION_KEYS.choices]: `✅ Ваш вибір зафіксовано:\n\nПослуги: {services}\nСпособ оплати: {payment}\n\nМи зв'яжемося з вами найближчим часом!`,
    [TRANSLATION_KEYS.summaryDetails]: `Ваш вибір:\n\nПослуги: {services}\nСпособ оплати: {payment}`,
    [TRANSLATION_KEYS.noServicesSelected]: `❌ Послуги не вибрані. Будь ласка, виберіть хоча б одну послугу для продовження.`,
    [TRANSLATION_KEYS.pleaseUseKeyboard]: `⚠️ Будь ласка, використовуйте кнопки меню для вибору.`,
    [TRANSLATION_KEYS.askManagerMessage]:
      "Всі подальші питання ви можете задати нашому менеджеру. Він буде радий вам допомогти!",
    buttons: {
      [TRANSLATION_KEYS.buttons.confirm]: "Підтвердити вибір",
      [TRANSLATION_KEYS.buttons.connect]: "Зв'язатися з {manager}",
      [TRANSLATION_KEYS.buttons.back]: "Назад",
      services: {
        [TRANSLATION_KEYS.buttons.services.video_call]: "Відеодзвінок",
        [TRANSLATION_KEYS.buttons.services.tuning]: "Тюнінг",
        [TRANSLATION_KEYS.buttons.services.customs]: "Митне оформлення",
        [TRANSLATION_KEYS.buttons.services.logistics]: "Логістика",
      },
      payment: {
        [TRANSLATION_KEYS.buttons.payment.eur]: "EUR",
        [TRANSLATION_KEYS.buttons.payment.usd]: "USD",
        [TRANSLATION_KEYS.buttons.payment.crypto]: "Криптовалюта",
      },
    },
  },
};
