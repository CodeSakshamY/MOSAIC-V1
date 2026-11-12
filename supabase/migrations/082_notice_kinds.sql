-- Notices for a reaction and a project invitation need their own kinds.

alter type public.notification_type add value 'reaction';
alter type public.notification_type add value 'project_invite';
