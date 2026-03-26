import 'dotenv/config';
import Aedes from 'aedes';
import { createServer } from 'net';

const port = Number(process.env.MQTT_BROKER_PORT) || 1883;

// Aedes 브로커 인스턴스 생성
const aedes = new Aedes();
const server = createServer(aedes.handle);

// 타임스탬프 포맷 헬퍼
function timestamp() {
  return new Date().toLocaleString('ko-KR', { hour12: false });
}

// 클라이언트 연결
aedes.on('client', (client) => {
  console.log(`[${timestamp()}] 클라이언트 연결: ${client.id}`);
});

// 클라이언트 해제
aedes.on('clientDisconnect', (client) => {
  console.log(`[${timestamp()}] 클라이언트 해제: ${client.id}`);
});

// 토픽 구독
aedes.on('subscribe', (subscriptions, client) => {
  const topics = subscriptions.map((s) => s.topic).join(', ');
  console.log(`[${timestamp()}] 토픽 구독: ${topics} (클라이언트: ${client.id})`);
});

// 토픽 구독 해제
aedes.on('unsubscribe', (subscriptions, client) => {
  console.log(`[${timestamp()}] 토픽 구독 해제: ${subscriptions.join(', ')} (클라이언트: ${client.id})`);
});

// 메시지 발행 ($SYS/ 시스템 토픽 필터링)
aedes.on('publish', (packet, client) => {
  if (client && !packet.topic.startsWith('$SYS/')) {
    const payload = packet.payload.toString();
    console.log(`[${timestamp()}] 메시지 발행: ${packet.topic} → ${payload}`);
  }
});

// 서버 시작
server.listen(port, () => {
  console.log(`[${timestamp()}] MQTT 브로커 시작 - 포트: ${port}`);
});

// Graceful Shutdown
function shutdown() {
  console.log(`\n[${timestamp()}] 브로커 종료 중...`);
  aedes.close(() => {
    server.close(() => {
      console.log(`[${timestamp()}] 브로커 종료 완료`);
      process.exit(0);
    });
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
