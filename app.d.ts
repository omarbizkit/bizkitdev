// app.d.ts
// Astro Locals type extensions for authentication

import type { Session, User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    session: Session | null;
    user: User | null;
  }
}
