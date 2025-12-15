import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sxmfwcchpoqcgiwrjiac.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4bWZ3Y2NocG9xY2dpd3JqaWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDg2OTUsImV4cCI6MjA3OTQyNDY5NX0.1g59B1LespkCedLyUi9WKzAPD9KdYH-0ZdC07j9m0FE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);