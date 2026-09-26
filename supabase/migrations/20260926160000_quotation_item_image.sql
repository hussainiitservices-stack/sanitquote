alter table public.quotation_items
  add column if not exists image_path text;

comment on column public.quotation_items.image_path is
  'Catalog image path copied when the line is saved so the PDF stays stable.';
