import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { reissueAccess, verifiedUser } from "@/lib/auth/session";
import { publicUser } from "@/lib/auth/shape";
import { updateProfileSchema } from "@/lib/auth/validation";
import { issuePhoneOtp } from "@/lib/auth/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Name and phone number.
 *
 * The address is not editable here on purpose: changing it is a change of
 * identity, and doing it properly means proving the new address before the old
 * one stops working. That flow is worth building deliberately rather than
 * bolting onto a profile form, so for now it is a conversation with the
 * workshop.
 *
 * A new number is stored but not trusted. It is written with
 * `phoneVerifiedAt` cleared and a code goes out immediately, so an unproven
 * number can never be used to receive anything on the account's behalf.
 */
export async function PATCH(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`profile:${user.id}`, 10, 10 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = updateProfileSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { fullName, phone } = parsed.data;
  const phoneChanged = Boolean(phone && phone !== user.phone);

  try {
    if (phoneChanged) {
      const taken = await prisma.user.findFirst({
        where: { phone, phoneVerifiedAt: { not: null }, NOT: { id: user.id } },
        select: { id: true },
      });

      if (taken) {
        return noStore(
          fail(409, "Please check the form.", {
            fields: { phone: "That number is already registered to an account." },
          })
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(phoneChanged ? { phone, phoneVerifiedAt: null, status: "PENDING" as const } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        avatarUrl: true,
        status: true,
        passwordHash: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    let codeSent = false;
    if (phoneChanged && phone) {
      const issued = await issuePhoneOtp({ id: user.id, phone });
      codeSent = issued.delivered;
    }

    // The token carries the verification flags, so it has to be re-minted or
    // the dashboard would keep showing the old state for a quarter of an hour.
    await reissueAccess(updated);

    return noStore(ok({ user: publicUser(updated), verifyPhone: phoneChanged, codeSent }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return noStore(
        fail(409, "Please check the form.", {
          fields: { phone: "That number is already registered to an account." },
        })
      );
    }
    return noStore(serverError("profile", err));
  }
}
