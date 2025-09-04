const ws = new WebSocket(`ws://${window.location.hostname}/ws`);

ws.onopen = function() {
    console.log("WebSocket connection established");
    ws.send("getState");
};

ws.onclose = function() {
    console.log("WebSocket connection closed");
    setTimeout(() => {
    }, 5000);
};

ws.onmessage = function(event) {
    console.log("Message received: " + event.data);
    const ledStateDisplay = document.getElementById("state");
    
    if (event.data === "ON" || event.data === "OFF") {
        ledStateDisplay.innerHTML = event.data;
    } else {
        console.log("Confirmation from server: " + event.data);
    }
};

function buttonClick() {
    const ledStateDisplay = document.getElementById("state");
    const currentStatus = ledStateDisplay.innerHTML;

    if (currentStatus === "ON") {
        console.log("Sending toggleOFF");
        ws.send("toggleOFF");
    } else {
        console.log("Sending toggleON");
        ws.send("toggleON");
    }
}

function sendMessage() {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value;

    if (message.trim() === "") {
        return;
    }
    console.log("Sending message: " + message);
    ws.send(message);
    messageInput.value = "";
}

function sendJSON() {
    const message = JSON.stringify({
        name: "Flavius",
        age: 25
    });
    console.log("Sending JSON: " + message);
    ws.send(message);
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    const toggleButton = document.getElementById('toggleButton');
    const sendJsonButton = document.getElementById('sendJsonButton');

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (toggleButton) {
        toggleButton.addEventListener('click', buttonClick);
    }
    if (sendJsonButton) {
        sendJsonButton.addEventListener('click', sendJSON);
    }
});
