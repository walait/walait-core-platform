import { registerAs } from "@nestjs/config";

const whatsappConfig = registerAs("whatsapp", () => ({
  appSecret: process.env.META_APP_SECRET ?? process.env.WHATSAPP_APP_SECRET ?? "",
  verifyToken: process.env.META_VERIFY_TOKEN ?? process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  accessToken: process.env.META_ACCESS_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  phoneNumberId: process.env.META_PHONE_NUMBER_ID ?? process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  apiVersion: process.env.META_API_VERSION ?? "v19.0",
}));

export default whatsappConfig;
