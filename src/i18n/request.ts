import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import ca from "../../messages/ca.json";

const messages: Record<string, typeof ca> = { ca };

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ca";

  return {
    locale,
    messages: messages[locale] ?? messages.ca,
  };
});
