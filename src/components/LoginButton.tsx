import React, { useMemo } from "react";
import "hive-authentication/build.css";
import { useAioha } from "@aioha/react-provider";
import { AuthButton } from 'hive-authentication';
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import type { HiveAuthUser } from "../context/AuthContext";

const LoginButton: React.FC = () => {
  const { aioha } = useAioha()
  const firebaseWeb2Config = useMemo(() => {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

    if (!apiKey || !authDomain || !databaseURL || !projectId || !storageBucket || !messagingSenderId || !appId || !measurementId) {
      return undefined;
    }

    return {
      apiKey,
      authDomain,
      databaseURL,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId,
    };
  }, []);

  const handleAuthenticate = async (hiveResult: HiveAuthUser) => {
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
  };

  const handleWeb2Authenticate = async (web2Result: unknown) => {
    const response = await fetch(`${HD_API_SERVER}/web2-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(web2Result),
    });
    if (!response.ok) {
      throw new Error("Web2 authentication failed");
    }

    const data = await response.json();
    return JSON.stringify(data);
  };

  return (
    <AuthButton
      onAuthenticate={handleAuthenticate}
      aioha={aioha}
      shouldShowSwitchUser={true}
      onClose={() => {
      }}
      onSignMessage={(username) => {
        return `${new Date().toISOString()}:${username}`;
      }}
      theme="dark"
      encryptionKey={import.meta.env.VITE_LOCAL_KEY}
      isActiveFieldVisible={true}
      web2Config={firebaseWeb2Config}
      onWeb2Authenticate={handleWeb2Authenticate}
    />
  );
};

export default LoginButton;


