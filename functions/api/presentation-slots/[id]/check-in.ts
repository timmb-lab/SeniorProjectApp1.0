import type { Env } from "../../../_types.ts";
import { handlePresentationSlotTransition } from "../../../_lib/presentation-slots.ts";

export const onRequestPost: PagesFunction<Env> = (context) => {
  return handlePresentationSlotTransition(context, "check_in");
};
