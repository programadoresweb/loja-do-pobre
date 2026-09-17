create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  avatar_url text not null default 'https://i.pravatar.cc/150?img=47',
  bio text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.stories enable row level security;
alter table public.messages enable row level security;

create policy "Perfis são públicos" on public.profiles for select using (true);
create policy "Usuário cria o próprio perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "Usuário edita o próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Posts são públicos" on public.posts for select using (true);
create policy "Usuário cria posts próprios" on public.posts for insert with check (auth.uid() = author_id);
create policy "Usuário apaga posts próprios" on public.posts for delete using (auth.uid() = author_id);
create policy "Curtidas são públicas" on public.likes for select using (true);
create policy "Usuário gerencia suas curtidas" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Comentários são públicos" on public.comments for select using (true);
create policy "Usuário cria comentários próprios" on public.comments for insert with check (auth.uid() = author_id);
create policy "Usuário apaga comentários próprios" on public.comments for delete using (auth.uid() = author_id);
create policy "Seguidores são públicos" on public.follows for select using (true);
create policy "Usuário gerencia seus follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
create policy "Stories ativos são públicos" on public.stories for select using (expires_at > now());
create policy "Usuário cria stories próprios" on public.stories for insert with check (auth.uid() = author_id);
create policy "Usuário apaga stories próprios" on public.stories for delete using (auth.uid() = author_id);
create policy "Usuário vê suas mensagens" on public.messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Usuário envia mensagens" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Usuário apaga suas mensagens" on public.messages for delete using (auth.uid() = sender_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name) values (new.id, split_part(new.email, '@', 1), split_part(new.email, '@', 1));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
