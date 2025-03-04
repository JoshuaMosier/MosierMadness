-- Function to create profile on signup
create or replace function create_profile_for_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
exception when others then
  raise log 'Error in create_profile_for_user: %', SQLERRM;
  return new;
end;
$$ language plpgsql security definer set search_path = public; 