import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const intent = searchParams.get('intent');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  if (intent === 'signup') {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!profile) {
        return NextResponse.redirect(`${origin}/signup/complete`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
