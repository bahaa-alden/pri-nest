declare namespace Express {
  interface User {
    sub: string;
    email: string;
    role: 'USER' | 'ADMIN';
    refreshToken?: string;
    refreshTokenId?: string;
  }
}
