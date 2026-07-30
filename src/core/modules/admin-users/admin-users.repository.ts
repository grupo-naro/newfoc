/**
 * Repositorio de usuarios admin — única capa que habla con Prisma.
 *
 * Sólo expone usuarios con `isAdmin = true`. Los demás `User` (clientes
 * futuros, OAuth) son invisibles desde acá.
 */
import { prisma } from "@/core/lib/db";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  mustChangePassword: boolean;
  createdAt: Date;
  createdBy: { id: string; email: string } | null;
}

const adminSelect = {
  id: true,
  email: true,
  name: true,
  mustChangePassword: true,
  createdAt: true,
  createdBy: { select: { id: true, email: true } },
} as const;

export async function listAdmins(): Promise<AdminUserRow[]> {
  return prisma.user.findMany({
    where: { isAdmin: true },
    orderBy: { createdAt: "asc" },
    select: adminSelect,
  });
}

export async function findAdminById(id: string): Promise<AdminUserRow | null> {
  return prisma.user.findFirst({
    where: { id, isAdmin: true },
    select: adminSelect,
  });
}

export async function findAdminByEmail(email: string): Promise<{
  id: string;
  passwordHash: string | null;
} | null> {
  return prisma.user.findFirst({
    where: { email, isAdmin: true },
    select: { id: true, passwordHash: true },
  });
}

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { isAdmin: true } });
}

export interface CreateAdminData {
  email: string;
  name: string | null;
  passwordHash: string;
  createdById: string | null;
}

export async function createAdmin(data: CreateAdminData) {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      isAdmin: true,
      mustChangePassword: true,
      createdById: data.createdById,
    },
    select: { id: true, email: true },
  });
}

export async function deleteAdmin(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

export async function updatePassword(
  id: string,
  passwordHash: string,
  mustChangePassword: boolean,
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword },
  });
}

/** Hash de la clave actual — para verificar antes de cambiarla. */
export async function getPasswordHash(id: string): Promise<string | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true },
  });
  return row?.passwordHash ?? null;
}
