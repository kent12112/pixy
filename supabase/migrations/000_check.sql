-- Run this in Supabase SQL Editor to check what exists
select
  table_name,
  'table' as type
from information_schema.tables
where table_schema = 'public'

union all

select
  routine_name,
  'function'
from information_schema.routines
where routine_schema = 'public'

union all

select
  trigger_name,
  'trigger'
from information_schema.triggers
where trigger_schema = 'public'

order by type, table_name;
