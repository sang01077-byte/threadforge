'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // 로그인 모드 vs 회원가입 모드 전환

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    try {
      setLoading(true);

      if (isSignUp) {
        // 1. 회원가입 로직
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // 회원가입 성공 시 user_credits 테이블에 기본 크레딧(50개) 생성
        await supabase.from('user_credits').insert({ user_email: email, credits: 50 });

        alert('회원가입이 완료되었습니다! 로그인해 주세요.');
        setIsSignUp(false);
      } else {
        // 2. 로그인 로직
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        alert('로그인 성공!');
        router.push('/'); // 대시보드로 이동
      }
    } catch (error: any) {
      alert(error.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2">
            ThreadForge AI
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? '계정을 생성하여 AI 스레드를 시작하세요' : '로그인하여 마케팅 대시보드로 이동하세요'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">이메일 주소</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 font-bold rounded-xl transition-all shadow-lg text-center cursor-pointer text-sm mt-2"
          >
            {loading ? '처리 중...' : isSignUp ? '회원가입하기' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-teal-400 hover:underline cursor-pointer"
          >
            {isSignUp ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
          </button>
        </div>
      </div>
    </div>
  );
}