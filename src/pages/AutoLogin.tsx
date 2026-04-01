/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "hive-authentication";
import CryptoJS from "crypto-js";

const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';

export default function AutoLogin() {
  const { roomname } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing login...");
  const { setSecretKey, setCurrentUser, addLoggedInUser } = useAuthStore();
  const hasRun = useRef(false);

  useEffect(() => {
    const encryptionKey = import.meta.env.VITE_LOCAL_KEY || "";
    setSecretKey(encryptionKey);
  }, [setSecretKey]);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const doAutoLogin = async () => {
      try {
        setStatus("Logging out existing user...");
        localStorage.clear();

        setStatus("Loading user data...");
        const encoded = import.meta.env.VITE_ROOM_CREDENTIALS;
        if (!encoded) throw new Error("ROOM_CREDENTIALS not set");

        const decoded: string[] = JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
          )
        );

        const username = decoded.find((u: string) => u === roomname);
        if (!username) throw new Error(`No credentials found for ${roomname}`);

        setStatus(`Logging in ${username}...`);

        const decryptionKey = import.meta.env.VITE_DECRYPTION_KEY;
        if (!decryptionKey) throw new Error("DECRYPTION_KEY not set");

        const timestamp = new Date().toISOString();
        const encryptedTimestamp = CryptoJS.AES.encrypt(timestamp, decryptionKey).toString();
        const encryptedUsername = CryptoJS.AES.encrypt(username, decryptionKey).toString();

        setStatus("Please wait, connecting to server...");
        const response = await fetch(`${HD_API_SERVER}/privileged-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp,
            encryptedTimestamp,
            encryptedUsername,
          }),
        });

        if (!response.ok) {
          throw new Error("Server authentication failed");
        }

        const data = await response.json();

        const user = {
          username,
          provider: "privileged",
          challenge: "",
          publicKey: "",
          proof: timestamp,
          serverResponse: JSON.stringify(data),
          loginType: "hive" as const,
        };

        addLoggedInUser(user);
        setCurrentUser(user);

        setStatus("Login successful! Redirecting...");
        setTimeout(() => navigate("/claim"), 800);
      } catch (err: any) {
        console.error(err);
        setStatus("Something went wrong, redirecting to home...");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    doAutoLogin();
  }, [roomname, navigate, setCurrentUser, addLoggedInUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <p className="text-lg">{status}</p>
      <p className="text-sm text-gray-500">
        Please wait while we log you in automatically...
      </p>
    </div>
  );
}
