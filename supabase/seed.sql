-- Local demo only. `supabase db reset` runs this file. `supabase db push` does not.
-- The account is labeled demo. It is not a real person, and the password is not for a hosted project.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@polymath.local',
  crypt('local-demo-only', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@polymath.local"}'::jsonb,
  'email',
  '11111111-1111-4111-8111-111111111111',
  now(),
  now(),
  now()
);

update public.profiles
set
  username = 'demo_builder',
  display_name = 'Demo Builder',
  bio = 'A labeled local demo account. Not a real person.',
  city = 'Bengaluru',
  state = 'Karnataka',
  country = 'IN',
  age_group = '18_24',
  onboarding_complete = true,
  is_demo = true
where id = '11111111-1111-4111-8111-111111111111';

insert into public.profile_skills (profile_id, skill_id)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000013'
  );

insert into public.projects (
  id,
  owner_id,
  name,
  slug,
  description,
  category,
  status,
  visibility,
  is_demo
)
values
  (
    '22222222-2222-4222-8222-222222222221',
    '11111111-1111-4111-8111-111111111111',
    'Demo sensor node',
    'demo-sensor-node',
    'A labeled demo project about a small environmental sensor.',
    'robotics',
    'prototype',
    'public',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    'Demo sensor fork',
    'demo-sensor-fork',
    'A labeled demo fork of the sensor node project.',
    'robotics',
    'idea',
    'public',
    true
  );

update public.projects
set parent_project_id = '22222222-2222-4222-8222-222222222221'
where id = '22222222-2222-4222-8222-222222222222';

insert into public.build_logs (id, project_id, author_id, title, content)
values (
  '33333333-3333-4333-8333-333333333331',
  '22222222-2222-4222-8222-222222222221',
  '11111111-1111-4111-8111-111111111111',
  'Demo: first log',
  'This build log is demo content. It does not describe a real experiment.'
);

insert into public.communities (
  id,
  name,
  slug,
  description,
  category,
  created_by,
  visibility,
  is_demo
)
values
  (
    '44444444-4444-4444-8444-444444444441',
    'Demo robotics lab',
    'demo-robotics-lab',
    'A labeled demo community. It is not a real lab.',
    'technology',
    '11111111-1111-4111-8111-111111111111',
    'public',
    true
  ),
  (
    '44444444-4444-4444-8444-444444444442',
    'Demo city builders',
    'demo-city-builders',
    'A labeled demo community for local builders. It is not a real group.',
    'city',
    '11111111-1111-4111-8111-111111111111',
    'public',
    true
  );

insert into public.opportunities (
  id,
  title,
  slug,
  organizer,
  description,
  category,
  is_online,
  official_url,
  is_published,
  is_demo,
  created_by
)
values (
  '55555555-5555-4555-8555-555555555551',
  'Demo: sample workshop',
  'demo-sample-workshop',
  'Demo organizer',
  'This opportunity is demo content. The link is an example URL, not an application page. No deadline is stated.',
  'workshop',
  true,
  'https://example.com/demo-workshop',
  true,
  true,
  '11111111-1111-4111-8111-111111111111'
);

insert into public.opportunities (
  id,
  title,
  slug,
  organizer,
  description,
  category,
  location,
  country,
  official_url,
  deadline,
  is_published,
  is_demo,
  created_by
)
values (
  '55555555-5555-4555-8555-555555555552',
  'Demo: sample hackathon',
  'demo-sample-hackathon',
  'Demo organizer',
  'This opportunity is demo content. The deadline and link are examples, not a real contest.',
  'hackathon',
  'Bengaluru',
  'IN',
  'https://example.com/demo-hackathon',
  '2026-12-31 18:30:00+00',
  true,
  true,
  '11111111-1111-4111-8111-111111111111'
);

-- Demo rows stay hidden until a request sets app.allow_demo = true.
-- ALTER DATABASE cannot run inside the seed transaction.
