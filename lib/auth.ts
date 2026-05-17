import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type AuthSession, type Role } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "vedics_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(session: AuthSession) {
  return jwt.sign(session, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireRole(role: Role) {
  const session = await getCurrentSession();
  if (!session || session.role !== role) {
    redirect(role === "admin" ? "/admin/login" : "/login");
  }
  return session;
}

export const authCookieName = COOKIE_NAME;
