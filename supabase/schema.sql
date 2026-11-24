-- =====================================================================
-- ARKA — AI-powered Road for Knowledge & Advancement
-- Skema database Supabase (PostgreSQL). Jalankan SEKALI di SQL Editor.
-- Prinsip: RLS aktif di SEMUA tabel. Klien hanya boleh MEMBACA data miliknya.
-- Semua penulisan dilakukan server (route handler) dengan service role,
-- setelah pemeriksaan peran & sekolah (FR-009, GR1).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Sekolah ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  type text not null default 'swasta' check (type in ('swasta','negeri')),
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- ---------- Profil pengguna ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','counselor','principal','admin')),
  full_name text not null,
  email text not null,
  birth_date date,
  class_level int check (class_level in (10,11,12)),
  class_name text,
  school_id uuid references public.schools(id) on delete set null,
  -- pending_consent | active | rejected | deactivated
  status text not null default 'active' check (status in ('pending_consent','active','rejected','deactivated')),
  verified boolean not null default false,          -- untuk guru BK / kepala sekolah (diverifikasi admin)
  parent_name text,
  parent_contact text,
  deletion_requested_at timestamptz,                -- FR-010: dihapus permanen 30 hari setelahnya
  created_at timestamptz not null default now()
);
create index if not exists profiles_school_idx on public.profiles(school_id, role);

-- ---------- Persetujuan orang tua (FR-002, GR2) ----------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  code_hash text not null,
  parent_name text,
  parent_contact text not null,
  status text not null default 'pending' check (status in ('pending','granted','rejected','superseded')),
  policy_version text not null,
  expires_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists consents_student_idx on public.consents(student_id);

-- ---------- Asesmen: progres (simpan & lanjutkan) dan hasil ----------
create table if not exists public.assessment_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  assessment_key text not null check (assessment_key in ('minat','kepribadian','bakat','nilai')),
  answers jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (student_id, assessment_key)
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  assessment_key text not null check (assessment_key in ('minat','kepribadian','bakat','nilai')),
  scores jsonb not null,
  completed_at timestamptz not null default now()
);
create index if not exists results_student_idx on public.assessment_results(student_id, assessment_key, completed_at desc);

-- ---------- Career Roadmap (FR-005, FR-011) ----------
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists roadmaps_student_idx on public.roadmaps(student_id, saved_at desc);

-- ---------- Companion (FR-006, FR-020) ----------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  provider text,
  model text,
  feedback text check (feedback in ('helpful','inaccurate')),
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_student_idx on public.chat_messages(student_id, created_at desc);

-- ---------- Catatan konseling (FR-015) — hanya terlihat oleh guru penulis ----------
create table if not exists public.counseling_notes (
  id uuid primary key default gen_random_uuid(),
  counselor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------- Survei kejelasan arah (M5) ----------
create table if not exists public.clarity_surveys (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  phase text not null check (phase in ('pre','post')),
  score int not null check (score between 1 and 5),
  created_at timestamptz not null default now()
);

-- ---------- Kode verifikasi (hapus akun) ----------
create table if not exists public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Database karier (FR-005, FR-006, FR-013) ----------
create table if not exists public.career_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('major','profession','scholarship')),
  name text not null,
  category text not null,
  description text not null,
  riasec text not null default '',       -- mis. 'IR' (kode Holland dominan)
  aptitudes text[] not null default '{}', -- kunci dimensi bakat
  work_values text[] not null default '{}',
  skills text[] not null default '{}',
  related text[] not null default '{}',
  source text not null default 'Database karier ARKA (draf kurasi, D5)'
);
create index if not exists career_kind_idx on public.career_items(kind);

-- ---------- Instrumentasi (Bab 7): hanya ID pseudonim, jenis event, waktu ----------
create table if not exists public.events (
  id bigserial primary key,
  pseudo_id text not null,
  event_type text not null,
  created_at timestamptz not null default now()
);
create index if not exists events_type_idx on public.events(event_type, created_at);

-- ---------- Audit log (Bab 10: disimpan minimal 12 bulan) ----------
create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid,
  action text not null,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.assessment_progress enable row level security;
alter table public.assessment_results enable row level security;
alter table public.roadmaps enable row level security;
alter table public.chat_messages enable row level security;
alter table public.counseling_notes enable row level security;
alter table public.clarity_surveys enable row level security;
alter table public.verification_codes enable row level security;
alter table public.career_items enable row level security;
alter table public.events enable row level security;
alter table public.audit_logs enable row level security;

-- Data publik non-pribadi
drop policy if exists "schools readable" on public.schools;
create policy "schools readable" on public.schools for select using (true);
drop policy if exists "careers readable" on public.career_items;
create policy "careers readable" on public.career_items for select using (true);

-- Data pribadi: hanya pemilik yang boleh membaca miliknya
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own progress" on public.assessment_progress;
create policy "own progress" on public.assessment_progress for select using (auth.uid() = student_id);
drop policy if exists "own results" on public.assessment_results;
create policy "own results" on public.assessment_results for select using (auth.uid() = student_id);
drop policy if exists "own roadmaps" on public.roadmaps;
create policy "own roadmaps" on public.roadmaps for select using (auth.uid() = student_id);
drop policy if exists "own chat" on public.chat_messages;
create policy "own chat" on public.chat_messages for select using (auth.uid() = student_id);
drop policy if exists "own surveys" on public.clarity_surveys;
create policy "own surveys" on public.clarity_surveys for select using (auth.uid() = student_id);
drop policy if exists "own notes (counselor)" on public.counseling_notes;
create policy "own notes (counselor)" on public.counseling_notes for select using (auth.uid() = counselor_id);
-- consents, verification_codes, events, audit_logs: TIDAK ada policy → hanya server (service role).

-- =====================================================================
-- Agregasi per sekolah (dashboard guru BK FR-008 & laporan kepsek FR-018)
-- SECURITY DEFINER + hanya service_role yang boleh memanggil.
-- =====================================================================
create or replace function public.school_student_overview(p_school uuid, p_since timestamptz default '1970-01-01')
returns table (
  id uuid, full_name text, class_level int, class_name text, created_at timestamptz,
  assessments_done int, has_roadmap boolean, steps_total int, steps_done int,
  last_clarity int, top_interest text, last_activity timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    p.id, p.full_name, p.class_level, p.class_name, p.created_at,
    (select count(distinct r.assessment_key) from assessment_results r where r.student_id = p.id and r.completed_at >= p_since)::int,
    rm.data is not null,
    coalesce(jsonb_array_length(rm.data->'steps'), 0)::int,
    coalesce((select count(*) from jsonb_array_elements(rm.data->'steps') s where (s->>'done')::boolean), 0)::int,
    (select c.score from clarity_surveys c where c.student_id = p.id order by c.created_at desc limit 1),
    (select e.key from (
        select r.scores from assessment_results r
        where r.student_id = p.id and r.assessment_key = 'minat' and r.completed_at >= p_since
        order by r.completed_at desc limit 1
      ) lr, jsonb_each_text(lr.scores) e order by e.value::numeric desc limit 1),
    greatest(
      p.created_at,
      (select max(m.created_at) from chat_messages m where m.student_id = p.id),
      (select max(r.completed_at) from assessment_results r where r.student_id = p.id)
    )
  from profiles p
  left join lateral (select r.data from roadmaps r where r.student_id = p.id order by r.saved_at desc limit 1) rm on true
  where p.school_id = p_school and p.role = 'student' and p.status = 'active' and p.deletion_requested_at is null;
$$;

revoke execute on function public.school_student_overview(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.school_student_overview(uuid, timestamptz) to service_role;
