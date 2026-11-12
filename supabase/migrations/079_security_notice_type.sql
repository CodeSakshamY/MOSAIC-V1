-- A password change can leave a security notice.

alter type public.notification_type add value 'security';
