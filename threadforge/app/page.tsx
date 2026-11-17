'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [promptKeyword, setPromptKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedThread, setGeneratedThread] = useState<string>('');

  // 1. 페이지 접속 시 Supabase Auth 세션 확인 및 DB 크레딧 조회
  useEffect(() => {
    async function checkUserAndFetchCredits() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // 로그인 상태가 아니면 로그인 페이지로 이동
        router.push('/login');
        return;
      }

      const email = session.user.email || '';
      setUserEmail(email);

      // 해당 유저의 크레딧 조회
      const { data: userData } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_email', email)
        .single();

      if (userData) {
        setCredits(userData.credits);
      } else {
        // 데이터가 없으면 기본 50개 생성 후 저장
        await supabase.from('user_credits').insert({ user_email: email, credits: 50 });
        setCredits(50);
      }
    }

    checkUserAndFetchCredits();
  }, [router]);

  // 로그아웃 처리
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleGenerateThread = async () => {
    if (!promptKeyword.trim()) {
      alert('스레드 주제나 키워드를 입력해 주세요!');
      return;
    }

    if (credits <= 0) {
      alert('크레딧이 부족합니다! 충전 후 이용해주세요.');
      router.push('/checkout');
      return;
    }

    try {
      setLoading(true);
      setGeneratedThread('');

      // 1. AI 생성 API 호출
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptKeyword }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '스레드 생성에 실패했습니다.');
        return;
      }

      // 2. DB 크레딧 1개 차감 반영
      const nextCredits = credits - 1;
      const { error } = await supabase
        .from('user_credits')
        .update({ credits: nextCredits })
        .eq('user_email', userEmail);

      if (!error) {
        setCredits(nextCredits);
      }

      setGeneratedThread(data.thread);
    } catch (err) {
      console.error(err);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-12 pb-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            ThreadForge AI
          </span>
          <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
            Auth v1.0
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-2xl border border-gray-700 shadow-inner">
            <span className="text-xl">💎</span>
            <div className="text-sm">
              <span className="text-gray-400 mr-1">크레딧:</span>
              <span className="font-bold text-emerald-400 text-base">{credits} 개</span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="ml-2 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              충전
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-xl border border-gray-700 transition-all cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg md:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">AI 마케팅 스레드 자동 생성</h2>
            <p className="text-gray-400 text-sm mb-4">
              생성하고 싶은 주제나 키워드를 입력하면, AI가 마케팅 스레드를 작성해 드립니다. (1회 생성 시 1 크레딧 소모)
            </p>

            <input
              type="text"
              value={promptKeyword}
              onChange={(e) => setPromptKeyword(e.target.value)}
              placeholder="예: 20대 직장인 재테크 꿀팁, AI 마케팅 자동화 등"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white mb-4 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button 
            onClick={handleGenerateThread}
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 font-bold rounded-xl transition-all shadow-lg text-center cursor-pointer"
          >
            {loading ? 'AI가 스레드를 작성하는 중...' : '스레드 생성하기 (1 크레딧 소모)'}
          </button>

          {generatedThread && (
            <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-emerald-500/40">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-emerald-400">✨ 생성된 마케팅 스레드 결과</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedThread);
                    alert('클립보드에 복사되었습니다!');
                  }}
                  className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 cursor-pointer"
                >
                  복사하기
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-200 font-sans leading-relaxed">
                {generatedThread}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">👤 내 계정 정보</h3>
            <p className="text-gray-400 text-xs leading-relaxed break-all">
              현재 로그인된 계정으로 안전하게 크레딧과 데이터가 연동되어 있습니다.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400 break-all">
            <span className="block text-gray-500 mb-1">접속 이메일:</span>
            {userEmail}
          </div>
        </div>
      </main>
    </div>
  );
}