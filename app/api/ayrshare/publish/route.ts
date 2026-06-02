import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const AYRSHARE_API_URL = 'https://api.ayrshare.com/api/post';

const platformMap: Record<string, string> = {
  linkedin: 'linkedin',
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
};

export async function POST(request: Request) {
  try {
    const { postId, platform, userId, scheduledDate } = await request.json();

    if (!postId || !platform || !userId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AYRSHARE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Ayrshare non configuré. Ajoutez AYRSHARE_API_KEY dans Vercel.' },
        { status: 500 }
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

    const textField = `text_${platform}`;
    const imageField = `image_url_${platform}`;

    const content =
      post[textField] ||
      `${post.hook || ''}\n\n${post.title || ''}\n\n${post.cta || ''}`;

    const imageUrl = post[imageField];
    const videoUrl = post.video_url;

    const mediaUrls: string[] = [];

    if (imageUrl) mediaUrls.push(imageUrl);
    if (!imageUrl && videoUrl) mediaUrls.push(videoUrl);

    const ayrsharePlatform = platformMap[platform];

    if (!ayrsharePlatform) {
      return NextResponse.json(
        { error: `Plateforme non supportée: ${platform}` },
        { status: 400 }
      );
    }

    const payload: any = {
      post: content,
      platforms: [ayrsharePlatform],
    };

    if (mediaUrls.length > 0) {
      payload.mediaUrls = mediaUrls;
    }

    if (scheduledDate) {
      payload.scheduleDate = scheduledDate;
    }

    const response = await fetch(AYRSHARE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erreur Ayrshare:', result);

      return NextResponse.json(
        { error: result?.message || result?.errors?.[0]?.message || 'Erreur Ayrshare' },
        { status: response.status }
      );
    }

    const scheduledPlatforms = post.scheduled_platforms || {};

    const nextScheduledPlatforms = {
      ...scheduledPlatforms,
      [platform]: {
        scheduled_at: scheduledDate || new Date().toISOString(),
        status: scheduledDate ? 'scheduled' : 'published',
        ayrshare_id: result.id || result.postIds?.[0] || null,
      },
    };

    await supabaseAdmin
      .from('post_skeleton')
      .update({
        status_scheduled: scheduledDate ? 'scheduled' : 'published',
        scheduled_at: scheduledDate || new Date().toISOString(),
        scheduled_platform: platform,
        scheduled_platforms: nextScheduledPlatforms,
        ayrshare_response: result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: scheduledDate
        ? `Post programmé sur ${platform} avec Ayrshare`
        : `Post publié sur ${platform} avec Ayrshare`,
      result,
    });

  } catch (error: any) {
    console.error('Erreur ayrshare publish:', error);

    return NextResponse.json(
      { error: error.message || 'Erreur publication Ayrshare' },
      { status: 500 }
    );
  }
}
