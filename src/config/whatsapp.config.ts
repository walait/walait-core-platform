import { registerAs } from "@nestjs/config";

const whatsappConfig = registerAs("whatsapp", () => ({
  appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
}));

export default whatsappConfig;
