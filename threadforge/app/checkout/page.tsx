'use client';

import { useEffect, useState, useRef } from 'react';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
const customerKey = 'CUSTOMER_KEY_TEST_123';

export default function CheckoutPage() {
  const [amount] = useState(5000);
  const paymentWidgetRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment-widget';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      const paymentWidget = window.PaymentWidget(clientKey, customerKey);
      
      // 결제 UI 렌더링
      paymentWidget.renderPaymentMethods('#payment-method', { value: amount });
      // 이용약관 렌더링
      paymentWidget.renderAgreement('#agreement');

      paymentWidgetRef.current = paymentWidget;
    };
    document.body.appendChild(script);
  }, [amount]);

  const handlePayment = async () => {
    try {
      const paymentWidget = paymentWidgetRef.current;
      if (!paymentWidget) {
        alert('결제 위젯이 아직 로드되지 않았습니다. 잠시만 기다려주세요.');
        return;
      }

      await paymentWidget.requestPayment({
        orderId: 'order_' + Math.random().toString(36).substring(2, 15),
        orderName: 'ThreadForge AI 크레딧 50개 충전',
        successUrl: window.location.origin + '/checkout/success',
        failUrl: window.location.origin + '/checkout/fail',
        customerEmail: 'sang0107@gmail.com',
        customerName: '이정환',
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      // 어떤 에러든 빨간 화면 대신 알림창으로 띄워줍니다.
      alert('결제 수단을 먼저 선택해 주세요!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
        <h1 className="text-2xl font-bold mb-4">💎 크레딧 충전소</h1>
        <p className="text-gray-400 mb-6">스레드 자동 생성을 위한 크레딧을 충전하세요.</p>
        
        <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-700 flex justify-between items-center">
          <span>50 크레딧 충전 패키지</span>
          <span className="font-bold text-emerald-400">5,000원</span>
        </div>

        <div id="payment-method" className="w-full mb-4" />
        <div id="agreement" className="w-full mb-6" />

        <button
          onClick={handlePayment}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl transition-all shadow-lg cursor-pointer"
        >
          5,000원 결제하고 크레딧 받기
        </button>
      </div>
    </div>
  );
}