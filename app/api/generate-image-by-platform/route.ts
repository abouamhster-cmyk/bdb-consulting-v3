import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';
import sharp from 'sharp';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const IMAGE_BUCKET = 'generated-images';

const getPlanLimit = (planName: string): number => {
  switch (planName) {
    case 'pro':
      return 50;
    case 'business':
      return 200;
    default:
      return 0;
  }
};

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { postId, platform, userId } = body;

    console.log('🔵 API image appelée', { postId, platform, userId });

    if (!postId || !platform || !userId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('post_skeleton')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('❌ Post non trouvé:', postError);
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    console.log('✅ Post trouvé:', post.title);

    const promptField = `image_prompt_${platform}`;
    let imagePrompt = post[promptField];

    if (!imagePrompt) {
      imagePrompt = `Professional marketing image for: ${post.title}. Modern, clean, professional style. Square format 1024x1024. No logo. No readable text. Leave clean empty space in the bottom-right corner for the real company logo to be added later.`;
    }

    imagePrompt = `${imagePrompt}

RÈGLES STRICTES:
- Ne jamais afficher de logo.
- Ne jamais inventer de logo.
- Ne jamais dessiner une marque fictive.
- Ne jamais afficher de texte lisible.
- Laisser un espace propre en bas à droite pour ajouter le vrai logo ensuite.
`;

    console.log('📝 Prompt:', imagePrompt.substring(0, 200));

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('usage_image, plan_name')
      .eq('user_id', userId)
      .maybeSingle();

    const planName = subscription?.plan_name || 'starter';
    const limit = getPlanLimit(planName);
    const currentUsage = subscription?.usage_image || 0;

    console.log(`📊 Plan: ${planName}, Limite: ${limit}, Utilisation: ${currentUsage}`);

    if (limit === 0) {
      return NextResponse.json(
        { error: 'Fonctionnalité non disponible. Passez au plan Pro ou Business.' },
        { status: 402 }
      );
    }

    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: `Crédits images épuisés (${currentUsage}/${limit})` },
        { status: 402 }
      );
    }

    console.log('🎨 Génération image avec gpt-image-1...');

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
    });

    const b64 = response.data?.[0]?.b64_json;

    if (!b64) {
      console.error('❌ Réponse OpenAI sans b64_json:', response.data?.[0]);
      throw new Error("OpenAI n'a pas retourné d'image exploitable.");
    }

    console.log('✅ Image reçue en base64');

    const imageBuffer: Buffer = Buffer.from(b64, 'base64');
    let finalImageBuffer: Buffer = imageBuffer;

    const { data: config } = await supabaseAdmin
      .from('company_config')
      .select('logo_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (config?.logo_url) {
      try {
        console.log('🏷️ Logo trouvé, ajout sur l’image...');

        const logoResponse = await fetch(config.logo_url);

        if (!logoResponse.ok) {
          throw new Error(`Impossible de télécharger le logo: ${logoResponse.status}`);
        }

        const logoArrayBuffer = await logoResponse.arrayBuffer();
        const logoBuffer: Buffer = Buffer.from(logoArrayBuffer);

        const resizedLogo: Buffer = Buffer.from(
          await sharp(logoBuffer)
            .resize({
              width: 160,
              withoutEnlargement: true,
            })
            .png()
            .toBuffer()
        );

        finalImageBuffer = Buffer.from(
          await sharp(imageBuffer)
            .composite([
              {
                input: resizedLogo,
                gravity: 'southeast',
                blend: 'over',
              },
            ])
            .png()
            .toBuffer()
        );

        console.log('✅ Vrai logo ajouté sur l’image');
      } catch (logoError) {
        console.error('⚠️ Impossible d’ajouter le logo, image sauvegardée sans logo:', logoError);
      }
    } else {
      console.log('ℹ️ Aucun logo_url trouvé dans company_config, image sans logo');
    }

    const fileName = `images/${userId}/${postId}-${platform}-${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(fileName, finalImageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Erreur upload Supabase:', uploadError);
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    if (!imageUrl) {
      throw new Error("Impossible de récupérer l'URL publique de l'image.");
    }

    console.log('✅ Image uploadée:', imageUrl);

    await supabaseAdmin
      .from('subscriptions')
      .update({ usage_image: currentUsage + 1 })
      .eq('user_id', userId);

    const updateData: Record<string, string> = {
      [`image_url_${platform}`]: imageUrl,
      [`status_image_${platform}`]: 'completed',
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('post_skeleton')
      .update(updateData)
      .eq('id', postId);

    const duration = Date.now() - startTime;
    console.log(`✅ Image sauvegardée pour ${platform} durée: ${duration}ms`);

    return NextResponse.json({
      success: true,
      imageUrl,
      fallback: false,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur générale après ${duration}ms:`, error);

    return NextResponse.json(
      { error: error.message || 'Erreur génération image' },
      { status: 500 }
    );
  }
}
