"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from 'js-cookie';

export default function Home() {
    const [ip, setIp] = useState("");
    const [remember, setRemember] = useState(false);
    const [volume, setVolume] = useState(0);
    const [volumeType, setVolumeType] = useState("Media");
    const [maxVolume, setMaxVolume] = useState(15);

    const volumeSteps = {
        Media: 15,
        Call: 7,
        Ring: 7,
        Alarm: 7,
        System: 7,
    };

    useEffect(() => {
        setMaxVolume(volumeSteps[volumeType]);
        setVolume((prevVolume) => Math.min(prevVolume, volumeSteps[volumeType]));
    }, [volumeType]);

    useEffect(() => {
        const savedIp = Cookies.get('rememberedIp');
        if (savedIp) {
            setIp(savedIp);
            setRemember(true);
            handleConnect();
        }
    }, []);


    // TODO: Figure out cookie issue
    const handleConnect = async () => {
        const response = await fetch("http://127.0.0.1:5000/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip, remember }),
        });
        const data = await response.json();
        alert(data.message);

        if (remember) {
            Cookies.set('rememberedIp', ip, { expires: 365 });
        } else {
            Cookies.remove('rememberedIp');
        }
    };

    const timeoutIdRef = useRef(null);

    const sendVolumeToServer = async (value) => {
        await fetch("http://127.0.0.1:5000/volume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ volume: parseInt(value, 10), type: volumeType }),
        });
    };

    const handleVolumeChange = (value) => {
        setVolume(parseInt(value, 10));

        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        timeoutIdRef.current = setTimeout(() => {
            sendVolumeToServer(value);
        }, 300);
    };

    const handleMediaControl = async (action) => {
        await fetch("http://127.0.0.1:5000/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
        });
    };

    return (
        <div className="p-6 max-w-md mx-auto space-y-4">
            <h1 className="text-xl font-bold">Scrcpy Media Controller</h1>
            <div className="space-y-2">
                <input
                    type="text"
                    placeholder="Device IP"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="border p-2 w-full"
                />
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="mr-2"
                    />
                    Remember Me
                </label>
                <button
                    onClick={handleConnect}
                    className="bg-blue-500 text-white px-4 py-2 w-full"
                >
                    Connect
                </button>
            </div>
            <div className="space-y-2">
                <label>Volume Type</label>
                <select
                    value={volumeType}
                    onChange={(e) => setVolumeType(e.target.value)}
                    className="border p-2 w-full"
                >
                    {["Media", "Call", "Ring", "Alarm", "System"].map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <input
                    type="range"
                    min="0"
                    max={maxVolume}
                    value={volume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-full"
                />
                <p>Volume: {volume} / {maxVolume}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleMediaControl("play_pause")}
                    className="bg-green-500 text-white p-2"
                >
                    Play/Pause
                </button>
                <button
                    onClick={() => handleMediaControl("stop")}
                    className="bg-red-500 text-white p-2"
                >
                    Stop
                </button>
                <button
                    onClick={() => handleMediaControl("next")}
                    className="bg-gray-500 text-white p-2"
                >
                    Next
                </button>
                <button
                    onClick={() => handleMediaControl("prev")}
                    className="bg-gray-500 text-white p-2"
                >
                    Previous
                </button>
            </div>
        </div>
    );
}