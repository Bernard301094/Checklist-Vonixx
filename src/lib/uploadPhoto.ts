// Comprime una imagen via Canvas y la sube a Supabase Storage
// Retorna la URL pública del archivo o lanza un error.

const SUPABASE_URL = 'https://aogzdxwruaqgiaprmvuz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ3pkeHdydWFxZ2lhcHJtdnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjgxNzksImV4cCI6MjA5MjEwNDE3OX0.Gy8zfJKr_KsDUQqRf3WVPujBQYqfH-qcWiH46OCbpME';
const BUCKET = 'ocorrencias';

/** Comprime File/Blob para JPEG com qualidade e largura máxima configuráveis */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  quality = 0.72
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob falhou'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar imagem')); };
    img.src = url;
  });
}

/** Comprime e faz upload para Supabase Storage, retorna URL pública */
export async function uploadPhoto(file: File, folder = 'fotos'): Promise<string> {
  const compressed = await compressImage(file);
  const ext = 'jpg';
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
      body: compressed,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase upload falhou: ${res.status} — ${err}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}
