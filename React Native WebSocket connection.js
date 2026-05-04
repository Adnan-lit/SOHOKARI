// Connect to WebSocket
const socket = new SockJS('http://localhost:8080/ws');
const stompClient = Stomp.over(socket);

stompClient.connect(
  { Authorization: `Bearer ${token}` },
  () => {
    // Subscribe to your personal message queue
    stompClient.subscribe(`/user/${userId}/queue/messages`, (msg) => {
      const message = JSON.parse(msg.body);
      console.log('New message:', message);
    });
  }
);

// Send a message
stompClient.send('/app/chat.send', {}, JSON.stringify({
  bookingId: 'booking123',
  receiverId: 'user456',
  content: 'Hello!',
  messageType: 'TEXT'
}));
