from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config", "autoconnect.txt")
adb_connected = False
ip_address = ""

@app.route("/connect", methods=["POST"])
def connect():
    global adb_connected, ip_address
    data = request.json
    ip_address = data.get("ip")
    remember = data.get("remember", False)
    
    if remember:
        with open(CONFIG_PATH, "w") as f:
            f.write(ip_address)
    else:
        if os.path.exists(CONFIG_PATH):
            os.remove(CONFIG_PATH)
    
    try:
        subprocess.run(f"adb connect {ip_address}:5555", shell=True, check=True)
        adb_connected = True
        return jsonify({"message": "Connected", "status": "success"})
    except subprocess.CalledProcessError as e:
        return jsonify({"message": "Connection failed", "error": str(e), "status": "error"})
    
@app.route("/get_saved_ip", methods=["GET"])
def get_saved_ip():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r") as f:
            ip_address = f.read().strip()
        return jsonify({"ip": ip_address})
    else:
        return jsonify({"ip": ""})

@app.route("/volume", methods=["POST"])
def set_volume():
    if not adb_connected:
        return jsonify({"message": "Not connected", "status": "error"})
    
    data = request.json
    volume = int(data.get("volume", 50))
    stream_type_map = {"Media": 3, "Call": 0, "Ring": 2, "Alarm": 4, "System": 1}
    stream_type = stream_type_map.get(data.get("type", "Media"), 3)
    steps = {"Media": 15, "Call": 7, "Ring": 7, "Alarm": 7, "System": 7}[data.get("type", "Media")]
    
    subprocess.run(f"adb shell media volume --stream {stream_type} --set {volume}", shell=True)
    return jsonify({"message": f"Set volume to {volume}", "status": "success"})

@app.route("/media", methods=["POST"])
def media_control():
    if not adb_connected:
        return jsonify({"message": "Not connected", "status": "error"})
    
    actions = {"play_pause": 85, "stop": 86, "next": 87, "prev": 88}
    data = request.json
    action = data.get("action")
    
    if action in actions:
        subprocess.run(f"adb shell input keyevent {actions[action]}", shell=True)
        return jsonify({"message": f"{action} triggered", "status": "success"})
    else:
        return jsonify({"message": "Invalid action", "status": "error"})

if __name__ == "__main__":
    app.run(debug=True)
