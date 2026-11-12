-- A build log can record a failed attempt and what was learned.

alter type public.build_log_kind add value if not exists 'lesson';
