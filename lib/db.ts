import { supabase } from './supabase';

export async function upsertRecord(
  table: string,
  userId: string,
  data: Record<string, any>,
  uniqueField: string = 'user_id'
) {
  try {
    // Vérifier si l'enregistrement existe
    const { data: existing, error: findError } = await supabase
      .from(table)
      .select('id')
      .eq(uniqueField, userId)
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      return { error: findError };
    }
    
    if (existing) {
      // Mise à jour
      return await supabase
        .from(table)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq(uniqueField, userId);
    } else {
      // Insertion
      return await supabase
        .from(table)
        .insert({
          ...data,
          [uniqueField]: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
  } catch (err) {
    return { error: err };
  }
}

export async function saveCompanyConfig(userId: string, config: any) {
  return upsertRecord('company_config', userId, config);
}

export async function saveGenerationParams(userId: string, params: any) {
  return upsertRecord('generation_params', userId, params);
}

export async function saveEmailPreferences(userId: string, prefs: any) {
  return upsertRecord('email_preferences', userId, prefs);
}

export async function saveCompetitiveSource(userId: string, source: any) {
  return await supabase.from('competitive_sources').insert({
    user_id: userId,
    ...source,
    created_at: new Date().toISOString()
  });
}

export async function saveCompetitiveInsight(userId: string, insight: any) {
  return await supabase.from('competitive_insights').insert({
    user_id: userId,
    ...insight,
    created_at: new Date().toISOString()
  });
}