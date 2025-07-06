const express = require('express');
const { initTracer } = require('jaeger-client');
const axios = require('axios');

const app = express();
const port = 3000;

// Jaeger Tracer 초기화
const config = {
  serviceName: 'jaeger-thrift-app',
  sampler: {
    type: 'const',
    param: 1,
  },
  reporter: {
    logSpans: true,
    agentHost: 'jaeger-agent.observability.svc.cluster.local',
    agentPort: 6832, // UDP 프로토콜로 전송
  },
};

const options = {
  logger: {
    info: function logInfo(msg) {
      console.log('INFO ', msg);
    },
    error: function logError(msg) {
      console.log('ERROR', msg);
    },
  },
};

const tracer = initTracer(config, options);

// 미들웨어: 요청별 span 생성
app.use((req, res, next) => {
  const span = tracer.startSpan(req.method + ' ' + req.path);
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  
  req.span = span;
  next();
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  const span = req.span;
  
  // 비즈니스 로직 시뮬레이션
  span.log({ event: 'processing_request', message: 'Processing root request' });
  
  // 중첩 span 생성
  const childSpan = tracer.startSpan('business_logic', { childOf: span });
  childSpan.setTag('operation', 'calculate_response');
  
  // 작업 시뮬레이션
  setTimeout(() => {
    childSpan.log({ event: 'calculation_complete', result: 'Hello from Jaeger Thrift App!' });
    childSpan.finish();
    
    span.setTag('http.status_code', 200);
    span.finish();
    
    res.json({ 
      message: 'Hello from Jaeger Thrift App!',
      timestamp: new Date().toISOString(),
      traceId: span.context().traceId.toString('hex')
    });
  }, 100);
});

// 사용자 정보 엔드포인트 (복잡한 span 구조)
app.get('/user/:id', async (req, res) => {
  const span = req.span;
  const userId = req.params.id;
  span.setTag('user.id', userId);
  span.log({ event: 'fetching_user', userId: userId });

  // 1. DB 조회 span
  const dbSpan = tracer.startSpan('database_query', { childOf: span });
  dbSpan.setTag('db.operation', 'SELECT');
  dbSpan.setTag('db.table', 'users');

  setTimeout(async () => {
    dbSpan.log({ event: 'query_executed', query: `SELECT * FROM users WHERE id = ${userId}` });
    dbSpan.finish();

    // 2. 외부 API 호출 span (실제 호출)
    const apiSpan = tracer.startSpan('external_api_call', { childOf: span });
    apiSpan.setTag('http.url', 'https://jsonplaceholder.typicode.com/todos/1');
    apiSpan.setTag('http.method', 'GET');
    try {
      const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
      apiSpan.log({ event: 'api_response', status: response.status });
      apiSpan.setTag('api.status', response.status);
      apiSpan.setTag('api.title', response.data.title);
    } catch (err) {
      apiSpan.log({ event: 'api_error', error: err.message });
      apiSpan.setTag('error', true);
    }
    apiSpan.finish();

    // 3. 데이터 가공 span
    const processSpan = tracer.startSpan('process_user_data', { childOf: span });
    setTimeout(() => {
      processSpan.log({ event: 'processing_complete' });
      processSpan.finish();

      span.setTag('http.status_code', 200);
      span.finish();
      res.json({
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        traceId: span.context().traceId.toString('hex')
      });
    }, 80);
  }, 100);
});

// 주문 정보 엔드포인트 (더 복잡한 트레이스)
app.get('/order/:id', (req, res) => {
  const span = tracer.startSpan('GET /order/:id');
  const orderId = req.params.id;
  span.setTag('order.id', orderId);
  span.log({ event: 'fetching_order', orderId });

  // 1. 주문 DB 조회
  const dbSpan = tracer.startSpan('order_db_query', { childOf: span });
  dbSpan.setTag('db.operation', 'SELECT');
  dbSpan.setTag('db.table', 'orders');
  setTimeout(() => {
    dbSpan.finish();

    // 2. 결제 처리
    const paymentSpan = tracer.startSpan('payment_processing', { childOf: span });
    setTimeout(() => {
      paymentSpan.log({ event: 'payment_success' });
      paymentSpan.finish();

      // 3. 알림 전송
      const notifySpan = tracer.startSpan('send_notification', { childOf: span });
      setTimeout(() => {
        notifySpan.log({ event: 'notification_sent' });
        notifySpan.finish();

        span.setTag('http.status_code', 200);
        span.finish();
        res.json({
          orderId,
          status: 'completed',
          traceId: span.context().traceId.toString('hex')
        });
      }, 60);
    }, 100);
  }, 80);
});

// 에러 엔드포인트 (에러 시뮬레이션)
app.get('/error', (req, res) => {
  const span = req.span;
  
  span.log({ event: 'error_occurred', error: 'Simulated error' });
  span.setTag('error', true);
  span.setTag('http.status_code', 500);
  span.finish();
  
  res.status(500).json({ 
    error: 'Simulated error occurred',
    traceId: span.context().traceId.toString('hex')
  });
});

app.listen(port, () => {
  console.log(`Jaeger Thrift App listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET / - Root endpoint');
  console.log('  GET /user/:id - User info endpoint');
  console.log('  GET /error - Error simulation endpoint');
}); 