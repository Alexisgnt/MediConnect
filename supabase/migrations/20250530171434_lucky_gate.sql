create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "title" text not null,
    "message" text not null,
    "type" text not null check (type in ('info', 'warning', 'error', 'success')),
    "read" boolean not null default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    primary key ("id")
);

-- Create index for faster queries
create index "idx_notifications_user_id" on "public"."notifications" ("user_id");
create index "idx_notifications_read" on "public"."notifications" ("read");

-- Enable RLS
alter table "public"."notifications" enable row level security;

-- Create policies
create policy "Users can view their own notifications"
on "public"."notifications"
for select
to authenticated
using (auth.uid() = user_id);

create policy "System can create notifications"
on "public"."notifications"
for insert
to authenticated
with check (true);

create policy "Users can update their own notifications"
on "public"."notifications"
for update
to authenticated
using (auth.uid() = user_id);