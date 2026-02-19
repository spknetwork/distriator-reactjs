import React from "react";
import "hive-authentication/build.css";
import { useAioha } from "@aioha/react-provider";
import { AuthButton } from 'hive-authentication';
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import type { HiveAuthUser } from "../context/AuthContext";

const LoginButton: React.FC = () => {
  const { aioha } = useAioha();
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

  return (
    <AuthButton
      onAuthenticate={handleAuthenticate}
      aioha={aioha}
      onClose={() => {
      }}
      onSignMessage={(username) => {
        return `${new Date().toISOString()}:${username}`;
      }}
      theme="dark"
      encryptionKey={import.meta.env.VITE_LOCAL_KEY}
      isActiveFieldVisible={true}
    />
  );
};

export default LoginButton;


