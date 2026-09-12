// ==========================================
// نظام التحقق المركزي للإدارة
// ==========================================

export async function getAdminAuth(context) {

    const { request, env } = context;

    const cookieHeader =
        request.headers.get("Cookie") || "";

    const sessionToken =
        getCookieValue(
            cookieHeader,
            "admin_session"
        );


    if (!sessionToken) {

        return {
            authenticated: false,
            status: 401,
            message: "يجب تسجيل الدخول أولًا"
        };

    }


    const tokenHash =
        await sha256(sessionToken);


    const session =
        await env.DB
        .prepare(`
            SELECT
                s.id AS session_id,
                s.user_id,
                s.expires_at,

                u.username,
                u.full_name,
                u.role,
                u.is_active

            FROM admin_sessions s

            INNER JOIN admin_users u
                ON u.id = s.user_id

            WHERE s.token_hash = ?

            LIMIT 1
        `)
        .bind(tokenHash)
        .first();


    if (!session) {

        return {
            authenticated: false,
            status: 401,
            message: "جلسة تسجيل الدخول غير صالحة"
        };

    }


    if (Number(session.is_active) !== 1) {

        return {
            authenticated: false,
            status: 403,
            message: "هذا الحساب موقوف"
        };

    }


    // ======================================
    // التحقق من انتهاء الجلسة
    // ======================================

    const expiresAt =
        new Date(
            String(session.expires_at)
                .replace(" ", "T") +
            "Z"
        );


    if (
        !Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now()
    ) {

        await env.DB
        .prepare(`
            DELETE FROM admin_sessions
            WHERE id = ?
        `)
        .bind(session.session_id)
        .run();


        return {
            authenticated: false,
            status: 401,
            message: "انتهت جلسة تسجيل الدخول"
        };

    }


    // ======================================
    // قراءة الصلاحيات
    // ======================================

    let permissions = [];


    if (session.role === "super_admin") {

        permissions = ["*"];

    }

    else {

        const permissionResult =
            await env.DB
            .prepare(`
                SELECT permission
                FROM admin_permissions
                WHERE user_id = ?
            `)
            .bind(session.user_id)
            .all();


        permissions =
            (permissionResult.results || [])
            .map(
                item => item.permission
            );

    }


    return {

        authenticated: true,

        sessionId:
            session.session_id,

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

    };

}


// ==========================================
// طلب تسجيل الدخول فقط
// ==========================================

export async function requireAdmin(context) {

    const auth =
        await getAdminAuth(context);


    if (!auth.authenticated) {

        return {
            ok: false,

            response:
                Response.json(
                    {
                        success: false,
                        message:
                            auth.message
                    },
                    {
                        status:
                            auth.status || 401
                    }
                )
        };

    }


    return {
        ok: true,
        auth: auth
    };

}


// ==========================================
// طلب صلاحية معينة
// ==========================================

export async function requirePermission(
    context,
    permission
) {

    const adminCheck =
        await requireAdmin(context);


    if (!adminCheck.ok) {

        return adminCheck;

    }


    const auth =
        adminCheck.auth;


    // Super Admin لديه جميع الصلاحيات

    if (
        auth.user.role === "super_admin" ||
        auth.permissions.includes("*")
    ) {

        return {
            ok: true,
            auth: auth
        };

    }


    if (
        !auth.permissions.includes(permission)
    ) {

        return {
            ok: false,

            response:
                Response.json(
                    {
                        success: false,

                        message:
                            "ليس لديك صلاحية لتنفيذ هذه العملية"
                    },
                    {
                        status: 403
                    }
                )
        };

    }


    return {
        ok: true,
        auth: auth
    };

}


// ==========================================
// تسجيل نشاط إداري
// ==========================================

export async function logAdminActivity(
    context,
    auth,
    options = {}
) {

    try {

        const { request, env } =
            context;


        await env.DB
        .prepare(`
            INSERT INTO admin_activity_log
            (
                user_id,
                username,
                full_name,
                action,
                action_category,
                entity_type,
                entity_id,
                description,
                old_data,
                new_data,
                ip_address,
                user_agent
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
            auth.user.id,

            auth.user.username,

            auth.user.full_name,

            options.action || "unknown",

            options.action_category ||
                "administration",

            options.entity_type || null,

            options.entity_id !== undefined &&
            options.entity_id !== null
                ? String(options.entity_id)
                : null,

            options.description || null,

            options.old_data !== undefined
                ? JSON.stringify(options.old_data)
                : null,

            options.new_data !== undefined
                ? JSON.stringify(options.new_data)
                : null,

            request.headers.get(
                "CF-Connecting-IP"
            ) || "",

            request.headers.get(
                "User-Agent"
            ) || ""
        )
        .run();

    }

    catch (error) {

        // فشل السجل لا يجب أن يكسر العملية الأصلية

        console.error(
            "Admin activity log error:",
            error
        );

    }

}


// ==========================================
// قراءة Cookie
// ==========================================

function getCookieValue(
    cookieHeader,
    name
) {

    const cookies =
        cookieHeader.split(";");


    for (const cookie of cookies) {

        const parts =
            cookie
            .trim()
            .split("=");


        if (parts[0] === name) {

            return parts
                .slice(1)
                .join("=");

        }

    }


    return null;

}


// ==========================================
// SHA-256
// ==========================================

async function sha256(value) {

    const encoder =
        new TextEncoder();


    const digest =
        await crypto.subtle.digest(
            "SHA-256",
            encoder.encode(value)
        );


    return Array.from(
        new Uint8Array(digest)
    )
    .map(
        byte =>
            byte
            .toString(16)
            .padStart(2, "0")
    )
    .join("");

}
