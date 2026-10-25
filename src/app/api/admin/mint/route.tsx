import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const mockCard = {
      id: 'mock-' + Math.random().toString(36).substring(2, 9),
      name: body.name,
      category: body.category,
      image_url: body.image_url,
      rarity: body.rarity,
      power_score: body.power_score,
      market_value: body.market_value,
      claim_code: body.claim_code,
      is_claimed: false,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({ success: true, card: mockCard });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
