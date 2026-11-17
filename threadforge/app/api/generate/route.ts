import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    // OpenAI API 키가 아직 설정되지 않은 경우의 방어 코드 (테스트용 대체 텍스트 반환)
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        thread: `[테스트 모드 스레드 결과]\n\n1/3 🚀 "${prompt}"와(과) 관련하여 오늘 꼭 알아야 할 핵심 인사이트를 공유합니다!\n\n2/3 💡 많은 분들이 놓치고 있는 부분이지만, 올바른 전략 하나만으로도 결과를 완전히 바꿀 수 있습니다.\n\n3/3 🔥 지금 바로 ThreadForge AI와 함께 시작해보세요! #마케팅 #자동화 #AI`
      });
    }

    // 실제 OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 전문 소셜 미디어 마케팅 컨설턴트입니다. 사용자가 입력한 주제로 시선을 사로잡는 매력적인 3줄 요약형 스레드(Threads/X 포맷)를 작성해 주세요.'
          },
          {
            role: 'user',
            content: `주제: ${prompt}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API 호출 실패');
    }

    const generatedText = data.choices[0].message.content;

    return NextResponse.json({ success: true, thread: generatedText });
  } catch (error: any) {
    console.error('AI Generate Error:', error);
    return NextResponse.json(
      { message: error.message || 'AI 스레드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}