-- Show more and show less on the For you feed. Not interested stays a dismiss.

alter type public.feed_event_type add value if not exists 'more';
alter type public.feed_event_type add value if not exists 'less';
