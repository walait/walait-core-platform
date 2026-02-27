import { registerAs } from '@nestjs/config';

const whatsappConfig = registerAs('whatsapp', () => ({
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
}));

export default whatsappConfig;
