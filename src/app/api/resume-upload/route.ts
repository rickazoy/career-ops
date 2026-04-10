import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('resume') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF and Word documents are accepted' },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'pdf';
  const storagePath = `${user.id}/resume.${ext}`;

  // Upload to Supabase Storage (overwrite if exists)
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json(
      { error: `Upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('resumes')
    .getPublicUrl(storagePath);

  // Update profile with resume path
  const { data: existing } = await supabase
    .from('co_profiles')
    .select('id')
    .limit(1)
    .single();

  const resumeFields = {
    resume_path: storagePath,
    resume_filename: file.name,
    resume_updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase
      .from('co_profiles')
      .update(resumeFields)
      .eq('id', existing.id);
  }

  return NextResponse.json({
    success: true,
    path: storagePath,
    filename: file.name,
    url: urlData.publicUrl,
  });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current resume path from profile
  const { data: profile } = await supabase
    .from('co_profiles')
    .select('id, resume_path')
    .limit(1)
    .single();

  if (profile?.resume_path) {
    await supabase.storage.from('resumes').remove([profile.resume_path]);
    await supabase
      .from('co_profiles')
      .update({ resume_path: null, resume_filename: null, resume_updated_at: null })
      .eq('id', profile.id);
  }

  return NextResponse.json({ success: true });
}
