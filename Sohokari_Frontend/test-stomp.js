const { Client } = require('@stomp/stompjs');
const WebSocket = require('ws');

Object.assign(global, { WebSocket });

const client = new Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: () => {
    console.log('CONNECTED TO STOMP!');
    process.exit(0);
  },
  onWebSocketError: (evt) => {
    console.error('WS Error:', evt);
    process.exit(1);
  },
  onStompError: (frame) => {
    console.error('STOMP Error:', frame);
    process.exit(1);
  },
});

client.activate();
