import { data, type LoaderFunctionArgs } from "react-router";
import { getShare } from "../data/shares";

export async function sharedPlanLoader({ params }: LoaderFunctionArgs) {
  const share = await getShare(params.shareId ?? "");
  if (!share) throw data("Shared plan not found", { status: 404 });
  return share;
}
