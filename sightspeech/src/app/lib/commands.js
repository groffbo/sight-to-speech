
const FLASK_API_URL = "http://localhost:5000/data"

export function sendCommand(commandKey) {
  fetch(FLASK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: commandKey,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Command sent successfully. Server response:", data);
    })
    .catch((error) => {
      console.error("Error connecting to Flask API:", error);
    });
}
