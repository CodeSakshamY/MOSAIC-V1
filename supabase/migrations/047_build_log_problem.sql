-- A build log can record a problem that came up.

alter type public.build_log_kind add value if not exists 'problem';
