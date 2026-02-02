export interface LoginRequestDTO {
  challenge: string;
  proof: string;
  pubkey: string;
  username: string;
}

// Success Response DTO
export interface LoginSuccessResponseDTO {
  token: string;
  type: string;
}

export interface LocalStorageUserDTO {
  token: string;
  type: string;
  challenge: string;
  proof: string;
  pubkey: string;
  username: string;
}

// Error Response DTO
export interface LoginErrorResponseDTO {
  error: string;
}
