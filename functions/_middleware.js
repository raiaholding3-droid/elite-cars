export async function onRequest(context) {

    const {
        request,
        env,
        next
    } = context;


    const url =
        new URL(
            request.url
        );


    const pathname =
        url.pathname;


    // =====================================
    // صفحات الإدارة المحمية
    // =====================================

    const protectedAdminPages = [

        "/admin.html",
        "/admin",

        "/add-car.html",
        "/add-car",

        "/edit-car.html",
        "/edit-car",

        "/auction-rules.html",
        "/auction-rules"

    ];


    // =====================================
    // إذا لم تكن صفحة إدارة محمية
    // أكمل الطلب بشكل طبيعي
    // =====================================

    if (
        !protectedAdminPages.includes(
            pathname
        )
    ) {

        return next();

    }


    // =====================================
    // قراءة Session Cookie
    // =====================================

    const cookieHeader =
        request.headers.get(
            "Cookie"
        ) || "";


    const sessionToken =
        getCookieValue(
            cookieHeader,
            "admin_session"
        );


    if (!sessionToken) {

        return redirectToLogin(
            request.url
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

        return redirectToLogin(
            request.url
        );

    }


    // =====================================
    // الحساب موقوف
    // =====================================

    if (
        Number(
            session.is_active
        ) !== 1
    ) {

        return redirectToLogin(
            request.url
        );

    }


    // =====================================
    // انتهاء الجلسة
    // =====================================

    const expiresAt =
        new Date(
            session.expires_at
                .replace(
                    " ",
                    "T"
                ) +
            "Z"
        );


    if (
        !Number.isFinite(
            expiresAt.getTime()
        ) ||
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


        return redirectToLogin(
            request.url
        );

    }


    // =====================================
    // تحديث آخر نشاط
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
    // الجلسة صحيحة
    // اسمح بفتح الصفحة
    // =====================================

    return next();

}


// =====================================
// تحويل المستخدم إلى صفحة الدخول
// =====================================

function redirectToLogin(
    requestUrl
) {

    const url =
        new URL(
            requestUrl
        );


    url.pathname =
        "/admin-login.html";


    url.search =
        "";


    return Response.redirect(
        url.toString(),
        302
    );

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


    return arrayBufferToHex(
        digest
    );

}


// =====================================
// ArrayBuffer إلى HEX
// =====================================

function arrayBufferToHex(
    buffer
) {

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
