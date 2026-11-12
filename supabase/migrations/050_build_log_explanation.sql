-- A build log can be a technical explanation.

alter type public.build_log_kind add value if not exists 'explanation';
