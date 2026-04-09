import "dotenv/config";
import Aedes from "aedes";
import { createServer } from "net";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, createWebSocketStream } from "ws";

const port = Number(process.env.MQTT_BROKER_PORT) || 1883;
const wsPort = Number(process.env.MQTT_WS_PORT) || 9001;
const mqttUsername = process.env.MQTT_USERNAME;
const mqttPassword = process.env.MQTT_PASSWORD;

// 타임스탬프 포맷 헬퍼
function timestamp() {
  return new Date().toLocaleString("ko-KR", { hour12: false });
}

// Aedes 브로커 인스턴스 생성
const aedes = new Aedes();

// username/password 인증
aedes.authenticate = (client, username, password, callback) => {
  console.log("username", username);
  console.log("password", password?.toString());
  console.log("mqttUsername", mqttUsername);
  console.log("mqttPassword", mqttPassword);
  const valid =
    username === mqttUsername && password?.toString() === mqttPassword;
  if (!valid) {
    console.log(`[${timestamp()}] 인증 실패: ${client.id} (user: ${username})`);
  }
  callback(null, valid);
};

// TCP 서버 (포트 1883 — 내부/테스트용)
const server = createServer(aedes.handle);

// WebSocket 서버 (포트 9001 — 브라우저용)
const httpServer = createHttpServer();
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (conn) => {
  const stream = createWebSocketStream(conn);
  aedes.handle(stream);
});

// 클라이언트 연결
aedes.on("client", (client) => {
  console.log(`[${timestamp()}] 클라이언트 연결: ${client.id}`);
});

// 클라이언트 해제
aedes.on("clientDisconnect", (client) => {
  console.log(`[${timestamp()}] 클라이언트 해제: ${client.id}`);
});

// 토픽 구독
aedes.on("subscribe", (subscriptions, client) => {
  const topics = subscriptions.map((s) => s.topic).join(", ");
  console.log(
    `[${timestamp()}] 토픽 구독: ${topics} (클라이언트: ${client.id})`,
  );
});

// 토픽 구독 해제
aedes.on("unsubscribe", (subscriptions, client) => {
  console.log(
    `[${timestamp()}] 토픽 구독 해제: ${subscriptions.join(", ")} (클라이언트: ${client.id})`,
  );
});

// 메시지 발행 ($SYS/ 시스템 토픽 필터링)
aedes.on("publish", (packet, client) => {
  if (client && !packet.topic.startsWith("$SYS/")) {
    const payload = packet.payload.toString();
    console.log(`[${timestamp()}] 메시지 발행: ${packet.topic} → ${payload}`);
  }
});

// TCP 서버 시작
server.listen(port, () => {
  console.log(`[${timestamp()}] MQTT 브로커 시작 (TCP) - 포트: ${port}`);
});

// WebSocket 서버 시작
httpServer.listen(wsPort, () => {
  console.log(
    `[${timestamp()}] MQTT 브로커 시작 (WebSocket) - 포트: ${wsPort}`,
  );
});

// Graceful Shutdown
function shutdown() {
  console.log(`\n[${timestamp()}] 브로커 종료 중...`);
  aedes.close(() => {
    server.close(() => {
      httpServer.close(() => {
        console.log(`[${timestamp()}] 브로커 종료 완료`);
        process.exit(0);
      });
    });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
