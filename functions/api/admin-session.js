export async function onRequestGet(context) {

    try {

        const { request, env } = context;

        // =====================================
        // قراءة Cookie
        // =====================================

        const cookieHeader =
            request.headers.get("Cookie") || "";

        const sessionToken =
            getCookieValue(
                cookieHeader,
                "admin_session"
            );


        if (!sessionToken) {

            return Response.json(
                {
                    success: false,
                    authenticated: false,
                    message:
                        "غير مسجل الدخول"
                },
                {
                    status: 401
                }
            );

        }


        // =====================================
        // Hash للـ Token
        // =====================================

        const tokenHash =
            await sha256(
                sessionToken
            );


        // =====================================
        // البحث عن الجلسة والمستخدم
        // =====================================

        const session =
            await env.DB
            .prepare(`
                SELECT
                    s.id AS session_id,
                    s.user_id,
                    s.expires_at,
                    s.last_seen_at,

                    u.username,
                    u.full_name,
                    u.role,
                    u.is_active

                FROM admin_sessions s

                INNER JOIN admin_users u
                    ON u.id = s.user_id

                WHERE
                    s.token_hash = ?

                LIMIT 1
            `)
            .bind(
                tokenHash
            )
            .first();


        if (!session) {

            return Response.json(
                {
                    success: false,
                    authenticated: false,
                    message:
                        "الجلسة غير صالحة"
                },
                {
                    status: 401
                }
            );

        }


        // =====================================
        // التحقق من أن الحساب نشط
        // =====================================

        if (
            Number(
                session.is_active
            ) !== 1
        ) {

            return Response.json(
                {
                    success: false,
                    authenticated: false,
                    message:
                        "هذا الحساب موقوف"
                },
                {
                    status: 403
                }
            );

        }


        // =====================================
        // التحقق من انتهاء الجلسة
        // =====================================

        const expiresAt =
            new Date(
                session.expires_at
                    .replace(" ", "T") +
                "Z"
            );


        if (
            expiresAt.getTime() <=
            Date.now()
        ) {

            await env.DB
            .prepare(`
                DELETE FROM admin_sessions
                WHERE id = ?
            `)
            .bind(
                session.session_id
            )
            .run();


            return Response.json(
                {
                    success: false,
                    authenticated: false,
                    message:
                        "انتهت جلسة تسجيل الدخول"
                },
                {
                    status: 401
                }
            );

        }


        // =====================================
        // تحديث آخر نشاط للجلسة
        // =====================================

        await env.DB
        .prepare(`
            UPDATE admin_sessions
            SET
                last_seen_at =
                    CURRENT_TIMESTAMP
            WHERE id = ?
        `)
        .bind(
            session.session_id
        )
        .run();


        // =====================================
        // قراءة صلاحيات الموظف
        // =====================================

        let permissions = [];


        if (
            session.role ===
            "super_admin"
        ) {

            permissions = [
                "*"
            ];

        }

        else {

            const result =
                await env.DB
                .prepare(`
                    SELECT permission
                    FROM admin_permissions
                    WHERE user_id = ?
                    ORDER BY permission ASC
                `)
                .bind(
                    session.user_id
                )
                .all();


            permissions =
                (
                    result.results || []
                )
                .map(
                    item =>
                        item.permission
                );

        }


        // =====================================
        // نجاح التحقق
        // =====================================

        return Response.json(
            {
                success: true,
                authenticated: true,

                user: {
                    id:
                        session.user_id,

                    username:
                        session.username,

                    full_name:
                        session.full_name,

                    role:
                        session.role
                },

                permissions:
                    permissions
            }
        );

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                authenticated: false,
                message:
                    "حدث خطأ أثناء التحقق من الجلسة",
                error:
                    error.message
            },
            {
                status: 500
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
            cookie.trim().split("=");


        if (
            parts[0] === name
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

async function sha256(value) {

    const encoder =
        new TextEncoder();


    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(
                value
            )
        );


    return arrayBufferToHex(
        digest
    );

}


// =====================================
// ArrayBuffer إلى HEX
// =====================================

function arrayBufferToHex(buffer) {

    return Array.from(
        new Uint8Array(
            buffer
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
