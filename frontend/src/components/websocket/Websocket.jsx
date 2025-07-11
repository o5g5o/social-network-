let socket = null;
const listeners = [];

export function connectWebSocket() {
    socket = new WebSocket(`ws://${window.location.host}/ws`);
  
    socket.onopen = () => {
      console.log("WebSocket connected");
    };
  
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message);
      handleWebSocketMessage(message);
    };
  
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    //   setTimeout(connectWebSocket, 1000); 
    };
  
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }
  
export function sendMessage(data) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not ready");
    return;
  }
  socket.send(JSON.stringify(data));
}

export function disconnectWebSocket() {
    if (socket) socket.close();
  }

