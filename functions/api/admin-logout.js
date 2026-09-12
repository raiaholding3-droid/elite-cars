import {
    getAdminAuth,
    logAdminActivity
} from "../_lib/admin-auth.js";


export async function onRequestPost(context) {

    try {

        const auth =
            await getAdminAuth(
                context
            );


        if (auth) {

            const cookieHeader =
                context.request.headers.get(
                    "Cookie"
                ) || "";


            const sessionToken =
                getCookieValue(
                    cookieHeader,
                    "admin_session"
                );


            if (sessionToken) {

                const tokenHash =
                    await sha256(
                        sessionToken
                    );


                await context.env.DB
                    .prepare(`
                        DELETE FROM admin_sessions

                        WHERE token_hash = ?
                    `)
                    .bind(
                        tokenHash
                    )
                    .run();

            }


            await logAdminActivity(
                context,
                auth,
                {
                    action:
                        "admin_logout",

                    action_category:
                        "authentication",

                    entity_type:
                        "admin_user",

                    entity_id:
                        auth.user.id,

                    description:
                        `تسجيل خروج: ${auth.user.full_name || auth.user.username}`
                }
            );

        }


        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "تم تسجيل الخروج بنجاح"
            }),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Set-Cookie":
                        "admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"

                }
            }
        );

    }

    catch (error) {

        console.error(
            "admin logout:",
            error
        );


        return new Response(
            JSON.stringify({
                success: false,
                message:
                    "حدث خطأ أثناء تسجيل الخروج"
            }),
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "application/json; charset=UTF-8"
                }
            }
        );

    }

}


// =====================================
// قراءة Cookie
// =====================================

function getCookieValue(
    cookieHeader,
    name
) {

    const cookies =
        cookieHeader.split(";");


    for (
        const cookie of cookies
    ) {

        const parts =
            cookie
                .trim()
                .split("=");


        if (
            parts[0] ===
            name
        ) {

            return parts
                .slice(1)
                .join("=");

        }

    }


    return null;

}


// =====================================
// SHA-256
// =====================================

async function sha256(
    value
) {

    const encoder =
        new TextEncoder();


    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(
                value
            )
        );


    return Array.from(
        new Uint8Array(
            digest
        )
    )
    .map(
        byte =>
            byte
                .toString(16)
                .padStart(
                    2,
                    "0"
                )
    )
    .join("");

}
