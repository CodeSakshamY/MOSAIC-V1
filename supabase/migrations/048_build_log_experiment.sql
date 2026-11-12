-- A build log can record an experiment.

alter type public.build_log_kind add value if not exists 'experiment';
