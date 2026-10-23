"use server";

import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { logger } from "~/server/logger";
import { api } from "~/trpc/server";

const log = logger.child({ scope: "submit-link" });

export type SubmitLinkResult = { ok: boolean; message: string };

// Errors with these codes carry messages written for the user
const USER_FACING_CODES = new Set(["BAD_REQUEST", "CONFLICT", "NOT_FOUND"]);

export async function submitLink(
  link: string,
  type: "game" | "article",
): Promise<SubmitLinkResult> {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return { ok: false, message: "Please paste a link first." };
  }

  try {
    if (type === "game") {
      await api.freeGames.validateGameLink({ link: trimmedLink });
      revalidatePath("/");
      return { ok: true, message: "Thanks! The game has been added." };
    }

    await api.articles.validateAndCreateArticle({ link: trimmedLink });
    revalidatePath("/articles");
    return { ok: true, message: "Thanks! The article has been added." };
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.cause instanceof ZodError) {
        return { ok: false, message: "That doesn't look like a valid link." };
      }
      if (USER_FACING_CODES.has(error.code)) {
        return { ok: false, message: error.message };
      }
    }

    log.error("Link submission failed", { type, link: trimmedLink, error });
    return {
      ok: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}
