import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), '../logs/portfolio.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'portfolio.json not found' }, { status: 404 });
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (typeof body.isPaused !== 'boolean') {
      return NextResponse.json({ error: 'isPaused must be a boolean' }, { status: 400 });
    }

    const filePath = path.resolve(process.cwd(), '../logs/portfolio.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'portfolio.json not found' }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    data.isPaused = body.isPaused;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

