import { Resend } from 'resend';

// Only instantiate if key exists to avoid crashing builds that lack the env var
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;
