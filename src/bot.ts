import { Bot, InlineKeyboard, Context } from "grammy";
import { UserData } from "./types";
import {
  handleStart,
  handleLanguageSelection,
  handleCarRequest,
  handleServiceToggle,
  handleServiceConfirmation,
  handlePaymentSelection,
  handleBackToCarRequest,
  handleBackToServices,
  handleTextMessage,
} from "./handlers";
import * as dotenv from "dotenv";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Bot is running!");
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const bot = new Bot(process.env.BOT_TOKEN || "");

// Set bot description
bot.api.setMyDescription(`👋 Welcome to G-Hub International!
Press /start to begin your journey with us.`);

// Store user data with timestamps for cleanup
interface UserDataWithTimestamp extends UserData {
  lastActivity: number;
  lastMessageTimestamp: number;
  messageCount: number;
}

// Use WeakMap for better garbage collection
const userDataMap = new Map<number, UserDataWithTimestamp>();
const USER_DATA_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const USER_DATA_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 30; // Maximum messages per minute

// Cache for rate limit checks
const rateLimitCache = new Map<number, { count: number; timestamp: number }>();

// Optimized rate limiting function with caching
function isRateLimited(userId: number): boolean {
  const now = Date.now();
  const cached = rateLimitCache.get(userId);

  if (!cached || now - cached.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitCache.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (cached.count >= MAX_MESSAGES_PER_WINDOW) {
    return true;
  }

  cached.count++;
  return false;
}

// Optimized user data initialization with caching
function initializeUserData(userId: number): UserDataWithTimestamp {
  const now = Date.now();
  const existingData = userDataMap.get(userId);

  if (existingData) {
    existingData.lastActivity = now;
    return existingData;
  }

  const newData: UserDataWithTimestamp = {
    car_request: "",
    selected_services: new Set(),
    last_selector_message_id: null,
    payment_method: null,
    language: null,
    manager: null,
    messagesToDelete: [],
    keyboard_active: false,
    workflow_completed: false,
    lastActivity: now,
    lastMessageTimestamp: now,
    messageCount: 0,
  };

  userDataMap.set(userId, newData);
  return newData;
}

// Optimized message deletion with batching and retries
async function deleteMessages(
  ctx: Context,
  messageIds: number[],
  maxRetries = 3,
  batchSize = 5
) {
  if (!messageIds.length) return;

  const batches = [];
  for (let i = 0; i < messageIds.length; i += batchSize) {
    batches.push(messageIds.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (messageId) => {
        let retries = 0;
        while (retries < maxRetries) {
          try {
            await ctx.api.deleteMessage(ctx.chat!.id, messageId);
            break;
          } catch (error) {
            retries++;
            if (retries === maxRetries) {
              console.error(
                `Failed to delete message ${messageId} after ${maxRetries} attempts:`,
                error
              );
            } else {
              await new Promise((resolve) =>
                setTimeout(
                  resolve,
                  Math.min(1000 * Math.pow(2, retries), 10000)
                )
              );
            }
          }
        }
      })
    );

    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Optimized cleanup with batch processing
function cleanupInactiveUserData() {
  const now = Date.now();
  const inactiveUsers = Array.from(userDataMap.entries())
    .filter(([_, data]) => now - data.lastActivity > USER_DATA_EXPIRY)
    .map(([userId]) => userId);

  inactiveUsers.forEach((userId) => {
    userDataMap.delete(userId);
    rateLimitCache.delete(userId);
  });

  if (inactiveUsers.length > 0) {
    console.log(`Cleaned up ${inactiveUsers.length} inactive user sessions`);
  }
}

// Set up periodic cleanup with error handling
setInterval(cleanupInactiveUserData, USER_DATA_CLEANUP_INTERVAL);

// Optimized callback query handler with caching
async function handleCallbackQuery(
  ctx: Context,
  handler: (ctx: Context, userData: UserData, ...args: any[]) => Promise<void>,
  ...args: any[]
) {
  const userId = ctx.from!.id;

  if (isRateLimited(userId)) {
    await ctx.reply("Please wait a moment before sending more messages.");
    return;
  }

  try {
    const userData = initializeUserData(userId);

    if (!userData.keyboard_active) {
      await deleteMessages(ctx, userData.messagesToDelete);
      userData.messagesToDelete = [];
    }

    await handler(ctx, userData, ...args);
  } catch (error) {
    console.error("Error in callback query handler:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    await ctx.reply("An error occurred. Please try again later.");
  }
}

// Optimized command handlers
bot.command("start", async (ctx) => {
  const userId = ctx.from!.id;

  if (isRateLimited(userId)) {
    await ctx.reply("Please wait a moment before sending more messages.");
    return;
  }

  try {
    const userData = initializeUserData(userId);
    await handleStart(ctx, userData);
  } catch (error) {
    console.error("Error in start command:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    await ctx.reply("An error occurred. Please try again later.");
  }
});

// Optimized callback query handlers
bot.callbackQuery(/^lang_(.+)$/, async (ctx) => {
  await handleCallbackQuery(ctx, handleLanguageSelection, ctx.match[1]);
});

bot.callbackQuery("back_to_car_request", async (ctx) => {
  await handleCallbackQuery(ctx, handleBackToCarRequest);
});

bot.callbackQuery("back_to_services", async (ctx) => {
  await handleCallbackQuery(ctx, handleBackToServices);
});

bot.callbackQuery(/^toggle_(.+)$/, async (ctx) => {
  await handleCallbackQuery(ctx, handleServiceToggle, ctx.match[1]);
});

bot.callbackQuery("confirm_services", async (ctx) => {
  await handleCallbackQuery(ctx, handleServiceConfirmation);
});

bot.callbackQuery(/^payment_(.+)$/, async (ctx) => {
  await handleCallbackQuery(ctx, handlePaymentSelection, ctx.match[1]);
});

// Optimized message handler
bot.on("message:text", async (ctx) => {
  const userId = ctx.from!.id;

  if (isRateLimited(userId)) {
    await ctx.reply("Please wait a moment before sending more messages.");
    return;
  }

  try {
    const userData = initializeUserData(userId);

    if (!userData.keyboard_active) {
      await deleteMessages(ctx, userData.messagesToDelete);
      userData.messagesToDelete = [];
    }

    if (userData.keyboard_active) {
      await handleTextMessage(ctx, userData);
      return;
    }

    if (!userData.language) {
      return;
    }

    await handleCarRequest(ctx, userData, ctx.message.text);
  } catch (error) {
    console.error("Error in message handler:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    await ctx.reply("An error occurred. Please try again later.");
  }
});

// Optimized error handling middleware
bot.catch((err) => {
  console.error("Error in bot:", err);
  if (err.error instanceof Error) {
    console.error("Error details:", {
      name: err.error.name,
      message: err.error.message,
      stack: err.error.stack,
    });
  }
});

// Start the bot with error handling
bot.start().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
