import jwt from "jsonwebtoken";

export function issueJwt(userId: string) {
  return jwt.sign(
    {
      sub: userId,
      role: 'authenticated',
    },
    process.env.SUPABASE_JWT_SECRET!,
    { expiresIn: '1h' }
  )
}