import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!email || !key || !folderId) {
    return NextResponse.json(
      { success: false, error: 'Google Drive not configured' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = (formData.get('filename') as string) || 'consent.pdf';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file' }, { status: 400 });
    }

    const auth = new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: res.data.id!,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return NextResponse.json({
      success: true,
      fileId: res.data.id,
      url: res.data.webViewLink,
    });
  } catch (err) {
    console.error('Google Drive upload error:', err);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
