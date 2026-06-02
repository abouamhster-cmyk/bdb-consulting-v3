import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, platform, userId, scheduledDate } = body;

    if (!postId || !platform || !userId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    const updateData: Record<string, string> = {
      status_scheduled: 'scheduled',
      scheduled_at: scheduledDate,
      scheduled_platform: platform,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from('post_skeleton')
      .update(updateData)
      .eq('id', postId)
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Post programmé en interne sur ${platform}`,
      scheduledDate,
      platform,
    });

  } catch (error: any) {
    console.error('Erreur schedule-post:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur programmation interne' },
      { status: 500 }
    );
  }
}
