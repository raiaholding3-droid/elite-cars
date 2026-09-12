export async function onRequestPost(context) {

    try {

        const { request, env } = context;

        const data =
            await request.json();


        const username =
            String(
                data.username || ""
            )
            .trim();


        const password =
            String(
                data.password || ""
            );


        if (
            !username ||
            !password
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم وكلمة المرور مطلوبان"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // البحث عن المستخدم
        // =====================================

        const user =
            await env.DB
            .prepare(`
                SELECT
                    id,
                    username,
                    password_hash,
                    full_name,
                    role,
                    is_active
                FROM admin_users
                WHERE username = ?
                LIMIT 1
            `)
            .bind(
                username
            )
            .first();


        if (!user) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم أو كلمة المرور غير صحيحة"
                },
                {
                    status: 401
                }
            );

        }


        if (
            Number(
                user.is_active
            ) !== 1
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "هذا الحساب موقوف"
                },
                {
                    status: 403
                }
            );

        }


        // =====================================
        // التحقق من كلمة المرور
        // =====================================

        const passwordOk =
            await verifyPassword(
                password,
                user.password_hash
            );


        if (!passwordOk) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم أو كلمة المرور غير صحيحة"
                },
                {
                    status: 401
                }
            );

        }


        // =====================================
        // حذف الجلسات المنتهية
        // =====================================

        await env.DB
        .prepare(`
            DELETE FROM admin_sessions
            WHERE expires_at <= CURRENT_TIMESTAMP
        `)
        .run();


        // =====================================
        // إنشاء Token عشوائي
        // =====================================

        const tokenBytes =
            crypto.getRandomValues(
                new Uint8Array(32)
            );


        const sessionToken =
            arrayBufferToHex(
                tokenBytes
            );


        const tokenHash =
            await sha256(
                sessionToken
            );


        // =====================================
        // مدة الجلسة
        // 12 ساعة
        // =====================================

        const expiresAt =
            new Date(
                Date.now() +
                12 *
                60 *
                60 *
                1000
            );


        const expiresSql =
            expiresAt
            .toISOString()
            .slice(0, 19)
            .replace(
                "T",
                " "
            );


        // =====================================
        // حفظ الجلسة
        // =====================================

        await env.DB
        .prepare(`
            INSERT INTO admin_sessions
            (
                user_id,
                token_hash,
                expires_at,
                last_seen_at
            )
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `)
        .bind(
            user.id,
            tokenHash,
            expiresSql
        )
        .run();


        // =====================================
        // تحديث آخر تسجيل دخول
        // =====================================

        await env.DB
        .prepare(`
            UPDATE admin_users
            SET
                last_login_at =
                    CURRENT_TIMESTAMP
            WHERE id = ?
        `)
        .bind(
            user.id
        )
        .run();


        // =====================================
        // تسجيل العملية
        // =====================================

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
                ip_address,
                user_agent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
            user.id,
            user.username,
            user.full_name,
            "login",
            "authentication",
            "admin_user",
            String(
                user.id
            ),
            "تم تسجيل الدخول إلى لوحة الإدارة",
            request.headers.get(
                "CF-Connecting-IP"
            ) || "",
            request.headers.get(
                "User-Agent"
            ) || ""
        )
        .run();


        // =====================================
        // Cookie آمنة
        // =====================================

        const cookie =
            [
                `admin_session=${sessionToken}`,
                "HttpOnly",
                "Secure",
                "SameSite=Strict",
                "Path=/",
                `Expires=${expiresAt.toUTCString()}`
            ]
            .join("; ");


        return new Response(
            JSON.stringify({
                success: true,
                message:
                    "تم تسجيل الدخول بنجاح",
                user: {
                    id:
                        user.id,
                    username:
                        user.username,
                    full_name:
                        user.full_name,
                    role:
                        user.role
                }
            }),
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Set-Cookie":
                        cookie
                }
            }
        );

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                message:
                    "حدث خطأ أثناء تسجيل الدخول",
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
// التحقق من كلمة المرور
// =====================================

async function verifyPassword(
    password,
    storedPassword
) {

    if (
        !storedPassword ||
        !storedPassword.includes(":")
    ) {

        return false;

    }


    const parts =
        storedPassword.split(":");


    if (
        parts.length !== 2
    ) {

        return false;

    }


    const salt =
        parts[0];


    const expectedHash =
        parts[1];


    const actualHash =
        await hashPassword(
            password,
            salt
        );


    return constantTimeEqual(
        actualHash,
        expectedHash
    );

}


// =====================================
// PBKDF2
// نفس إعدادات إنشاء المدير الرئيسي
// =====================================

async function hashPassword(
    password,
    salt
) {

    const encoder =
        new TextEncoder();


    const keyMaterial =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(
                password
            ),
            "PBKDF2",
            false,
            [
                "deriveBits"
            ]
        );


    const derivedBits =
        await crypto.subtle.deriveBits(
            {
                name:
                    "PBKDF2",

                salt:
                    hexToUint8Array(
                        salt
                    ),

                iterations:
                    100000,

                hash:
                    "SHA-256"
            },

            keyMaterial,

            256
        );


    return arrayBufferToHex(
        derivedBits
    );

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
// مقارنة آمنة
// =====================================

function constantTimeEqual(
    a,
    b
) {

    if (
        a.length !==
        b.length
    ) {

        return false;

    }


    let result = 0;


    for (
        let i = 0;
        i < a.length;
        i++
    ) {

        result |=
            a.charCodeAt(i) ^
            b.charCodeAt(i);

    }


    return result === 0;

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


// =====================================
// HEX إلى Uint8Array
// =====================================

function hexToUint8Array(hex) {

    const bytes =
        new Uint8Array(
            hex.length / 2
        );


    for (
        let i = 0;
        i < bytes.length;
        i++
    ) {

        bytes[i] =
            parseInt(
                hex.substr(
                    i * 2,
                    2
                ),
                16
            );

    }


    return bytes;

}
