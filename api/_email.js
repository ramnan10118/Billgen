import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM = 'RavenLog <noreply@ravenlog.in>';
export const APP_URL = process.env.VITE_APP_URL || 'https://ravenlog.in';
