import type { AssistRequest, AssistResponse } from "@roomcraft/shared";
import { z } from "zod";
import { config } from "../config";
import { FLOOR_MATERIALS } from "../domain/materials";
import { idToken } from "./auth";

/** A failed request, with a sentence that can be shown to the person. */
export class AssistantError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AssistantError";
  }
}

const TIMEOUT_MS = 90_000;
const color = z
  .string()
  .regex(/^#[0-9a-f]{6}$/)
  .nullable();
const reason = z.string();

const operationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("add"),
    placementId: z.string(),
    itemId: z.string(),
    x: z.number(),
    z: z.number(),
    rotation: z.number(),
    reason,
  }),
  z.object({
    op: z.literal("move"),
    placementId: z.string(),
    x: z.number(),
    z: z.number(),
    reason,
  }),
  z.object({ op: z.literal("rotate"), placementId: z.string(), rotation: z.number(), reason }),
  z.object({ op: z.literal("remove"), placementId: z.string(), reason }),
  z.object({
    op: z.literal("material"),
    floor: z.enum(FLOOR_MATERIALS).nullable(),
    floorColor: color,
    wallColor: color,
    reason,
  }),
]);

const responseSchema = z.object({
  suggestions: z.array(
    z.object({
      summary: z.string(),
      operations: z.array(operationSchema),
      rejected: z.array(
        z.object({
          op: z.string(),
          reason,
          code: z.enum([
            "invalid_operation",
            "unknown_item",
            "unknown_placement",
            "outside_room",
            "overlaps",
            "blocks_door",
            "over_budget",
            "fixed_rotation",
          ]),
          otherId: z.string().nullable(),
          openingId: z.string().nullable(),
        }),
      ),
    }),
  ),
  remainingToday: z.number(),
}) satisfies z.ZodType<AssistResponse>;

/** Asks the layout assistant for suggestions. Every operation it returns has been validated. */
export async function askAssistant(request: AssistRequest): Promise<AssistResponse> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}/v1/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await idToken()}` },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new AssistantError("The assistant could not be reached. Check your connection.", null, {
      cause: error,
    });
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AssistantError(
      detailOf(body) ?? "The assistant ran into a problem.",
      response.status,
    );
  }
  const parsed = responseSchema.safeParse(body);
  if (!parsed.success)
    throw new AssistantError("The assistant sent an answer we could not read.", 502);
  return parsed.data;
}

function detailOf(body: unknown): string | null {
  return typeof body === "object" &&
    body !== null &&
    "detail" in body &&
    typeof body.detail === "string"
    ? body.detail
    : null;
}
