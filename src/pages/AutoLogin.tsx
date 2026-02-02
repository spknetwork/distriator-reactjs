/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAioha } from "@aioha/react-provider";
import { useProgrammaticAuth } from "hive-authentication";
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';

export default function AutoLogin() {
  const { roomname } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Initializing login...");
  const { aioha } = useAioha();
  const { loginWithPrivateKey } = useProgrammaticAuth(aioha);
  const hasRun = useRef(false);

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

        const decoded = JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
          )
        );

        const roomCred = decoded.find((c: any) => c.roomname === roomname);
        if (!roomCred) throw new Error(`No credentials found for ${roomname}`);

        const { username, key } = roomCred;
        if (!username || !key) throw new Error("Invalid credentials");

        setStatus(`Logging in ${username}...`);
        await loginWithPrivateKey(
          username,
          key,
          async (hiveResult: any) => {
            setStatus("Please wait, connecting to server...");
            const response = await fetch(`${HD_API_SERVER}/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                challenge: hiveResult.challenge,
                proof: hiveResult.proof,
                pubkey: hiveResult.publicKey,
                username: hiveResult.username,
              }),
            });
            if (!response.ok) {
              throw new Error("Server authentication failed");
            }
            const data = await response.json();
            return JSON.stringify(data);
          }
        );
        setTimeout(() => navigate("/claim"), 800);
      } catch (err: any) {
        console.error(err);
        setStatus("Something went wrong, redirecting to home...");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    doAutoLogin();
  }, [roomname, navigate, loginWithPrivateKey]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <p className="text-lg">{status}</p>
      <p className="text-sm text-gray-500">
        Please wait while we log you in automatically...
      </p>
    </div>
  );
}
