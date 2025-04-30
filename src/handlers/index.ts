import { Context } from "grammy";
import {
  UserData,
  LanguageOption,
  PaymentOption,
  ServiceOption,
} from "../types";
import {
  createLanguageKeyboard,
  createServicesKeyboard,
  createPaymentKeyboard,
  createManagerKeyboard,
  LANGUAGE_OPTIONS,
  PAYMENT_OPTIONS,
  SERVICE_OPTIONS,
} from "../keyboards";
import { getTranslation, Translation, TranslationKey } from "../translations";

export async function handleStart(ctx: Context, userData: UserData) {
  userData.car_request = "";
  userData.selected_services = new Set();
  userData.last_selector_message_id = null;
  userData.payment_method = null;
  userData.language = null;
  userData.manager = null;
  userData.messagesToDelete = [];
  userData.keyboard_active = false;
  userData.workflow_completed = false;

  // Send welcome message in English
  await ctx.reply(
    `Thank you for contacting us! 🙏
🚗 We specialize in selling brand-new luxury vehicles with worldwide delivery, managing the entire process.`
  );

  // Send welcome message in Russian
  await ctx.reply(
    `Спасибо, что связались с нами! 🙏
🚗 Мы специализируемся на продаже новых люксовых автомобилей с доставкой по всему миру, управляя всем процессом.`
  );

  // Send language selection message in both languages
  const languageMessage = await ctx.reply(
    `🌐 Which language would you prefer to use?

🌐 На каком языке вы предпочитаете общаться?`,
    {
      reply_markup: createLanguageKeyboard(),
    }
  );
  userData.keyboard_active = true;
}

export async function handleLanguageSelection(
  ctx: Context,
  userData: UserData,
  languageId: string
) {
  const languageOption = LANGUAGE_OPTIONS.find(
    (opt: LanguageOption) => opt.id === languageId
  );
  if (!languageOption) return;

  userData.language = languageId;
  userData.manager = languageOption.manager;
  userData.keyboard_active = false;

  // Delete the language selection message
  if (ctx.callbackQuery?.message?.message_id) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        ctx.callbackQuery.message.message_id
      );
    } catch (error) {
      console.warn("Failed to delete language selection message:", error);
    }
  }

  const message = await ctx.reply(getTranslation(languageId, "carRequest"), {
    reply_markup: { remove_keyboard: true },
  });
  userData.messagesToDelete.push(message.message_id);
}

export async function handleCarRequest(
  ctx: Context,
  userData: UserData,
  messageText: string
) {
  userData.car_request = messageText;
  userData.keyboard_active = true;

  const sentMessage = await ctx.reply(
    `${getTranslation(
      userData.language!,
      "serviceSelection"
    )}\n\n${getTranslation(userData.language!, "serviceSelectionTitle")}`,
    {
      reply_markup: createServicesKeyboard(
        userData.selected_services,
        userData.language!
      ),
    }
  );

  userData.last_selector_message_id = sentMessage.message_id;
}

export async function handleServiceToggle(
  ctx: Context,
  userData: UserData,
  serviceId: string
) {
  if (userData.selected_services.has(serviceId)) {
    userData.selected_services.delete(serviceId);
  } else {
    userData.selected_services.add(serviceId);
  }

  try {
    if (userData.last_selector_message_id) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        userData.last_selector_message_id,
        `${getTranslation(
          userData.language!,
          "serviceSelection"
        )}\n\n${getTranslation(userData.language!, "serviceSelectionTitle")}`,
        {
          reply_markup: createServicesKeyboard(
            userData.selected_services,
            userData.language!
          ),
        }
      );
    }
  } catch (error) {
    // If editing fails, try to send a new message
    console.warn("Failed to edit message, sending new one:", error);

    // Send new message
    const newMessage = await ctx.reply(
      `${getTranslation(
        userData.language!,
        "serviceSelection"
      )}\n\n${getTranslation(userData.language!, "serviceSelectionTitle")}`,
      {
        reply_markup: createServicesKeyboard(
          userData.selected_services,
          userData.language!
        ),
      }
    );

    // Update tracking
    userData.last_selector_message_id = newMessage.message_id;
  }
}

export async function handleServiceConfirmation(
  ctx: Context,
  userData: UserData
) {
  if (userData.selected_services.size === 0) {
    // Show the no services warning
    await ctx.reply(getTranslation(userData.language!, "noServicesSelected"));
    return;
  }

  // Delete the service selection message if it exists
  if (userData.last_selector_message_id) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        userData.last_selector_message_id
      );
      userData.last_selector_message_id = null;
    } catch (error) {
      console.warn("Failed to delete service selection message:", error);
    }
  }

  userData.keyboard_active = true;
  const sentMessage = await ctx.reply(
    getTranslation(userData.language!, "paymentSelection"),
    { reply_markup: createPaymentKeyboard(userData.language!) }
  );

  userData.last_selector_message_id = sentMessage.message_id;
}

async function sendDataToAdmin(ctx: Context, userData: UserData) {
  const groupChatId = process.env.GROUP_CHAT_ID;
  if (!groupChatId) {
    console.error("GROUP_CHAT_ID not set in environment variables");
    return;
  }

  const selectedServices = Array.from(userData.selected_services)
    .map(
      (id) => SERVICE_OPTIONS.find((opt: ServiceOption) => opt.id === id)?.label
    )
    .filter(Boolean)
    .join(", ");

  const paymentOption = PAYMENT_OPTIONS.find(
    (opt: PaymentOption) => opt.id === userData.payment_method
  );

  const languageOption = LANGUAGE_OPTIONS.find(
    (opt: LanguageOption) => opt.id === userData.language
  );

  // Get user contact info
  const username = ctx.from?.username ? `@${ctx.from.username}` : null;
  const phoneNumber = (ctx.from as any)?.phone_number ? `📱 ${(ctx.from as any).phone_number}` : null;
  const userContact = username || phoneNumber || "No contact info";

  const message = `🚗 New Order Details:
👤 User: ${userContact}
🌐 Language: ${languageOption?.label || "Not specified"}
🚘 Car request: ${userData.car_request}
🛠 Services: ${selectedServices}
💳 Payment: ${paymentOption?.emoji} ${paymentOption?.label || "Not specified"}`;

  try {
    await ctx.api.sendMessage(groupChatId, message);
  } catch (error) {
    console.error("Failed to send data to group:", error);
  }
}

export async function handlePaymentSelection(
  ctx: Context,
  userData: UserData,
  paymentId: string
) {
  const paymentOption = PAYMENT_OPTIONS.find(
    (opt: PaymentOption) => opt.id === paymentId
  );
  if (!paymentOption) return;

  userData.payment_method = paymentId;

  // Delete the payment selection message if it exists
  if (userData.last_selector_message_id) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        userData.last_selector_message_id
      );
      userData.last_selector_message_id = null;
    } catch (error) {
      console.warn("Failed to delete payment selection message:", error);
    }
  }

  // Send summary of selections
  const selectedServices = Array.from(userData.selected_services)
    .map((id) =>
      getTranslation(
        userData.language!,
        `buttons.services.${id}` as TranslationKey
      )
    )
    .filter(Boolean)
    .join(", ");

  const summaryMessage = await ctx.reply(
    getTranslation(userData.language!, "summary", {
      vehicle: userData.car_request,
      services: selectedServices,
      payment: getTranslation(
        userData.language!,
        `buttons.payment.${paymentId}` as TranslationKey
      ),
    })
  );
  userData.messagesToDelete.push(summaryMessage.message_id);

  // Send data to admin
  await sendDataToAdmin(ctx, userData);

  // Send manager information with connection button
  const managerMessage = await ctx.reply(
    getTranslation(userData.language!, "managerInfo", {
      manager: userData.manager!,
    }),
    {
      reply_markup: createManagerKeyboard(
        userData.manager!,
        userData.language!
      ),
    }
  );
  userData.messagesToDelete.push(managerMessage.message_id);

  // Send final message about asking questions to manager
  const finalMessage = await ctx.reply(
    getTranslation(userData.language!, "askManagerMessage")
  );
  userData.messagesToDelete.push(finalMessage.message_id);

  // Mark workflow as completed
  userData.workflow_completed = true;
}

export async function handleBackToCarRequest(ctx: Context, userData: UserData) {
  // Reset service-related data
  userData.selected_services = new Set();
  userData.payment_method = null;
  userData.keyboard_active = false;

  // Delete the previous message if it exists
  if (userData.last_selector_message_id) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        userData.last_selector_message_id
      );
      userData.last_selector_message_id = null;
    } catch (error) {
      console.warn("Failed to delete previous message:", error);
    }
  }

  const message = await ctx.reply(
    getTranslation(userData.language!, "carRequest"),
    {
      reply_markup: { remove_keyboard: true },
    }
  );
  userData.messagesToDelete.push(message.message_id);
}

export async function handleBackToServices(ctx: Context, userData: UserData) {
  // Reset payment-related data
  userData.payment_method = null;
  userData.keyboard_active = true;

  // Delete the previous message if it exists
  if (userData.last_selector_message_id) {
    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        userData.last_selector_message_id
      );
      userData.last_selector_message_id = null;
    } catch (error) {
      console.warn("Failed to delete previous message:", error);
    }
  }

  const sentMessage = await ctx.reply(
    `${getTranslation(
      userData.language!,
      "serviceSelection"
    )}\n\n${getTranslation(userData.language!, "serviceSelectionTitle")}`,
    {
      reply_markup: createServicesKeyboard(
        userData.selected_services,
        userData.language!
      ),
    }
  );

  userData.last_selector_message_id = sentMessage.message_id;
}

// Add a new handler for text messages
export async function handleTextMessage(ctx: Context, userData: UserData) {
  if (userData.workflow_completed) {
    // If workflow is completed, send the manager message
    const message = await ctx.reply(
      getTranslation(userData.language!, "askManagerMessage")
    );
    // Don't add to messagesToDelete to keep the message
    return;
  }

  if (userData.keyboard_active) {
    // If keyboard is active, delete the message and show a warning
    const warningMessage = await ctx.reply(
      getTranslation(userData.language!, "pleaseUseKeyboard")
    );
    userData.messagesToDelete.push(warningMessage.message_id);
    return;
  }
}
