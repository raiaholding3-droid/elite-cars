export async function onRequestPost(context) {

    try {

        const { request, env } = context;

        const data =
            await request.json();

        const username =
            String(data.username || "")
            .trim();

        const password =
            String(data.password || "");

        const fullName =
            String(data.full_name || "")
            .trim();


        if (
            !username ||
            !password ||
            !fullName
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "جميع الحقول مطلوبة"
                },
                {
                    status: 400
                }
            );

        }


        if (username.length < 4) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم يجب أن يكون 4 أحرف على الأقل"
                },
                {
                    status: 400
                }
            );

        }


        if (password.length < 10) {

            return Response.json(
                {
                    success: false,
                    message:
                        "كلمة المرور يجب أن تكون 10 أحرف على الأقل"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // التأكد من عدم وجود Super Admin سابق
        // =====================================

        const existingSuperAdmin =
            await env.DB
            .prepare(`
                SELECT id
                FROM admin_users
                WHERE role = 'super_admin'
                LIMIT 1
            `)
            .first();


        if (existingSuperAdmin) {

            return Response.json(
                {
                    success: false,
                    message:
                        "تم إنشاء المدير الرئيسي مسبقًا"
                },
                {
                    status: 403
                }
            );

        }


        // =====================================
        // إنشاء Salt عشوائي
        // =====================================

        const saltBytes =
            crypto.getRandomValues(
                new Uint8Array(16)
            );

        const salt =
            arrayBufferToHex(
                saltBytes
            );


        // =====================================
        // اشتقاق Hash آمن لكلمة المرور
        // PBKDF2 + SHA-256
        // =====================================

        const passwordHash =
            await hashPassword(
                password,
                salt
            );


        const storedPassword =
            `${salt}:${passwordHash}`;


        // =====================================
        // إنشاء المدير الرئيسي
        // =====================================

        const result =
            await env.DB
            .prepare(`
                INSERT INTO admin_users
                (
                    username,
                    password_hash,
                    full_name,
                    role,
                    is_active
                )
                VALUES (?, ?, ?, 'super_admin', 1)
            `)
            .bind(
                username,
                storedPassword,
                fullName
            )
            .run();


        // =====================================
        // تسجيل العملية في سجل النشاط
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
            result.meta.last_row_id,
            username,
            fullName,
            "create_super_admin",
            "authentication",
            "admin_user",
            String(
                result.meta.last_row_id
            ),
            "تم إنشاء حساب المدير الرئيسي",
            request.headers.get(
                "CF-Connecting-IP"
            ) || "",
            request.headers.get(
                "User-Agent"
            ) || ""
        )
        .run();


        return Response.json(
            {
                success: true,
                message:
                    "تم إنشاء المدير الرئيسي بنجاح"
            }
        );

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                message:
                    "حدث خطأ أثناء إنشاء المدير الرئيسي",
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
// Hash كلمة المرور
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
            encoder.encode(password),
            "PBKDF2",
            false,
            [
                "deriveBits"
            ]
        );


    const derivedBits =
        await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt:
                    hexToUint8Array(
                        salt
                    ),
                iterations: 210000,
                hash: "SHA-256"
            },
            keyMaterial,
            256
        );


    return arrayBufferToHex(
        derivedBits
    );

}


// =====================================
// تحويل ArrayBuffer إلى HEX
// =====================================

function arrayBufferToHex(buffer) {

    return Array.from(
        new Uint8Array(buffer)
    )
    .map(
        byte =>
            byte
            .toString(16)
            .padStart(2, "0")
    )
    .join("");

}


// =====================================
// تحويل HEX إلى Uint8Array
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
