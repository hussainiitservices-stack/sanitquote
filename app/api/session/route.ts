import { jsonData } from "@/lib/api/http";
import { withSession } from "@/lib/api/with-session";

export async function GET() {
  return withSession(async (user) =>
    jsonData({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      merchantId: user.merchantId,
    }),
  );
}
