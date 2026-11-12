-- A builder can report an opportunity as outdated or misleading.

alter type public.report_reason add value 'outdated';
alter type public.report_reason add value 'misleading';

alter table public.reports
  add column opportunity_id uuid references public.opportunities (id) on delete restrict;

alter table public.reports drop constraint reports_one_target;

alter table public.reports
  add constraint reports_one_target check (
    num_nonnulls(profile_id, project_id, post_id, comment_id, opportunity_id) = 1
  );

drop policy reports_insert on public.reports;

create policy reports_insert on public.reports
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and num_nonnulls(profile_id, project_id, post_id, comment_id, opportunity_id) = 1
);
