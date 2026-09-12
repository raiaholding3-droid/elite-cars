import {
    requireAdmin,
    logAdminActivity
} from "../_lib/admin-auth.js";


// ==========================================
// الصلاحيات المسموح منحها للموظفين
// ==========================================

const ALLOWED_PERMISSIONS = [

    "dashboard_view",

    "cars_view",
    "cars_add",
    "cars_edit",
    "cars_delete",
    "cars_change_status",

    "auction_view",
    "auction_delete",

    "auction_rules_view",
    "auction_rules_create",
    "auction_rules_edit",
    "auction_rules_delete",
    "auction_rules_run"

];


// ==========================================
// GET
// جلب جميع الموظفين
// ==========================================

export async function onRequestGet(context) {

    try {

        const superAdminCheck =
            await requireSuperAdmin(context);


        if (!superAdminCheck.ok) {

            return superAdminCheck.response;

        }


        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        username,
                        full_name,
                        role,
                        is_active,
                        created_at,
                        updated_at,
                        last_login_at

                    FROM admin_users

                    WHERE role != 'super_admin'

                    ORDER BY id DESC
                `)
                .all();


        const users = [];


        for (const user of results || []) {

            const permissionResult =
                await context.env.DB
                    .prepare(`
                        SELECT permission

                        FROM admin_permissions

                        WHERE user_id = ?

                        ORDER BY permission ASC
                    `)
                    .bind(user.id)
                    .all();


            users.push({

                id:
                    user.id,

                username:
                    user.username,

                full_name:
                    user.full_name,

                role:
                    user.role,

                is_active:
                    Number(user.is_active) === 1,

                created_at:
                    user.created_at,

                updated_at:
                    user.updated_at,

                last_login_at:
                    user.last_login_at,

                permissions:
                    (permissionResult.results || [])
                    .map(
                        item =>
                            item.permission
                    )

            });

        }


        return Response.json({

            success: true,

            users:
                users,

            available_permissions:
                ALLOWED_PERMISSIONS

        });

    }

    catch (error) {

        console.error(
            "GET admin-users:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء جلب الموظفين"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// POST
// إنشاء موظف جديد
// ==========================================

export async function onRequestPost(context) {

    try {

        const superAdminCheck =
            await requireSuperAdmin(context);


        if (!superAdminCheck.ok) {

            return superAdminCheck.response;

        }


        const adminAuth =
            superAdminCheck.auth;


        const data =
            await context.request.json();


        const username =
            normalizeUsername(
                data.username
            );


        const fullName =
            normalizeText(
                data.full_name
            );


        const password =
            typeof data.password === "string"
                ? data.password
                : "";


        const permissions =
            sanitizePermissions(
                data.permissions
            );


        // ======================================
        // التحقق من البيانات
        // ======================================

        if (!username) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم مطلوب"
                },
                {
                    status: 400
                }
            );

        }


        if (username.length < 3) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
                },
                {
                    status: 400
                }
            );

        }


        if (!fullName) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم الموظف مطلوب"
                },
                {
                    status: 400
                }
            );

        }


        if (password.length < 8) {

            return Response.json(
                {
                    success: false,
                    message:
                        "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // التأكد من أن اسم المستخدم غير موجود
        // ======================================

        const existingUser =
            await context.env.DB
                .prepare(`
                    SELECT id

                    FROM admin_users

                    WHERE LOWER(username) =
                          LOWER(?)

                    LIMIT 1
                `)
                .bind(username)
                .first();


        if (existingUser) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم مستخدم بالفعل"
                },
                {
                    status: 409
                }
            );

        }


        // ======================================
        // تشفير كلمة المرور
        // ======================================

        const passwordHash =
            await hashPassword(
                password
            );


        // ======================================
        // إنشاء الموظف
        // ======================================

        const insertResult =
            await context.env.DB
                .prepare(`
                    INSERT INTO admin_users
                    (
                        username,
                        password_hash,
                        full_name,
                        role,
                        is_active,
                        created_at,
                        updated_at
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        'employee',
                        1,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                `)
                .bind(
                    username,
                    passwordHash,
                    fullName
                )
                .run();


        const userId =
            insertResult.meta.last_row_id;


        // ======================================
        // حفظ الصلاحيات
        // ======================================

        await savePermissions(
            context,
            userId,
            permissions
        );


        // ======================================
        // تسجيل النشاط
        // ======================================

        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "employee_create",

                action_category:
                    "employees",

                entity_type:
                    "admin_user",

                entity_id:
                    userId,

                description:
                    `إنشاء حساب موظف: ${fullName}`,

                new_data: {

                    username:
                        username,

                    full_name:
                        fullName,

                    role:
                        "employee",

                    is_active:
                        true,

                    permissions:
                        permissions

                }
            }
        );


        return Response.json(
            {
                success: true,

                message:
                    "تم إنشاء حساب الموظف بنجاح",

                user: {

                    id:
                        userId,

                    username:
                        username,

                    full_name:
                        fullName,

                    role:
                        "employee",

                    is_active:
                        true,

                    permissions:
                        permissions

                }
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        console.error(
            "POST admin-users:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء إنشاء الموظف"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// PUT
// تعديل بيانات الموظف وصلاحياته
// ==========================================

export async function onRequestPut(context) {

    try {

        const superAdminCheck =
            await requireSuperAdmin(context);


        if (!superAdminCheck.ok) {

            return superAdminCheck.response;

        }


        const adminAuth =
            superAdminCheck.auth;


        const data =
            await context.request.json();


        const userId =
            Number(data.id);


        if (
            !userId ||
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم الموظف غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // جلب الموظف الحالي
        // ======================================

        const oldUser =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        username,
                        full_name,
                        role,
                        is_active

                    FROM admin_users

                    WHERE id = ?

                    LIMIT 1
                `)
                .bind(userId)
                .first();


        if (!oldUser) {

            return Response.json(
                {
                    success: false,
                    message:
                        "الموظف غير موجود"
                },
                {
                    status: 404
                }
            );

        }


        if (
            oldUser.role ===
            "super_admin"
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "لا يمكن تعديل المدير الرئيسي من هذه الواجهة"
                },
                {
                    status: 403
                }
            );

        }


        const oldPermissionResult =
            await context.env.DB
                .prepare(`
                    SELECT permission

                    FROM admin_permissions

                    WHERE user_id = ?
                `)
                .bind(userId)
                .all();


        const oldPermissions =
            (oldPermissionResult.results || [])
            .map(
                item =>
                    item.permission
            );


        // ======================================
        // البيانات الجديدة
        // ======================================

        const username =
            data.username !== undefined
                ? normalizeUsername(
                    data.username
                )
                : oldUser.username;


        const fullName =
            data.full_name !== undefined
                ? normalizeText(
                    data.full_name
                )
                : oldUser.full_name;


        const isActive =
            data.is_active !== undefined
                ? (
                    data.is_active === true ||
                    data.is_active === 1 ||
                    data.is_active === "1"
                )
                : Number(
                    oldUser.is_active
                ) === 1;


        const permissions =
            data.permissions !== undefined
                ? sanitizePermissions(
                    data.permissions
                )
                : oldPermissions;


        if (!username) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم مطلوب"
                },
                {
                    status: 400
                }
            );

        }


        if (username.length < 3) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"
                },
                {
                    status: 400
                }
            );

        }


        if (!fullName) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم الموظف مطلوب"
                },
                {
                    status: 400
                }
            );

        }


        // ======================================
        // منع تكرار اسم المستخدم
        // ======================================

        const duplicateUser =
            await context.env.DB
                .prepare(`
                    SELECT id

                    FROM admin_users

                    WHERE
                        LOWER(username) =
                        LOWER(?)

                        AND id != ?

                    LIMIT 1
                `)
                .bind(
                    username,
                    userId
                )
                .first();


        if (duplicateUser) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المستخدم مستخدم بالفعل"
                },
                {
                    status: 409
                }
            );

        }


        // ======================================
        // تحديث بيانات الموظف
        // ======================================

        await context.env.DB
            .prepare(`
                UPDATE admin_users

                SET
                    username = ?,
                    full_name = ?,
                    is_active = ?,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(
                username,
                fullName,
                isActive ? 1 : 0,
                userId
            )
            .run();


        // ======================================
        // تغيير كلمة المرور إذا أُرسلت
        // ======================================

        let passwordChanged =
            false;


        if (
            typeof data.password ===
            "string" &&
            data.password.length > 0
        ) {

            if (
                data.password.length < 8
            ) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
                    },
                    {
                        status: 400
                    }
                );

            }


            const passwordHash =
                await hashPassword(
                    data.password
                );


            await context.env.DB
                .prepare(`
                    UPDATE admin_users

                    SET
                        password_hash = ?,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = ?
                `)
                .bind(
                    passwordHash,
                    userId
                )
                .run();


            passwordChanged =
                true;

        }


        // ======================================
        // تحديث الصلاحيات
        // ======================================

        await savePermissions(
            context,
            userId,
            permissions
        );


        // ======================================
        // عند إيقاف الحساب أو تغيير كلمة المرور
        // نحذف الجلسات المفتوحة
        // ======================================

        if (
            !isActive ||
            passwordChanged
        ) {

            await context.env.DB
                .prepare(`
                    DELETE FROM admin_sessions
                    WHERE user_id = ?
                `)
                .bind(userId)
                .run();

        }


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "employee_update",

                action_category:
                    "employees",

                entity_type:
                    "admin_user",

                entity_id:
                    userId,

                description:
                    `تعديل حساب الموظف: ${fullName}`,

                old_data: {

                    username:
                        oldUser.username,

                    full_name:
                        oldUser.full_name,

                    is_active:
                        Number(
                            oldUser.is_active
                        ) === 1,

                    permissions:
                        oldPermissions

                },

                new_data: {

                    username:
                        username,

                    full_name:
                        fullName,

                    is_active:
                        isActive,

                    permissions:
                        permissions,

                    password_changed:
                        passwordChanged

                }
            }
        );


        return Response.json({

            success: true,

            message:
                "تم تعديل بيانات الموظف بنجاح",

            user: {

                id:
                    userId,

                username:
                    username,

                full_name:
                    fullName,

                role:
                    "employee",

                is_active:
                    isActive,

                permissions:
                    permissions

            }

        });

    }

    catch (error) {

        console.error(
            "PUT admin-users:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء تعديل الموظف"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// PATCH
// تفعيل / إيقاف موظف بسرعة
// ==========================================

export async function onRequestPatch(context) {

    try {

        const superAdminCheck =
            await requireSuperAdmin(context);


        if (!superAdminCheck.ok) {

            return superAdminCheck.response;

        }


        const adminAuth =
            superAdminCheck.auth;


        const data =
            await context.request.json();


        const userId =
            Number(data.id);


        if (
            !userId ||
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم الموظف غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        const user =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        username,
                        full_name,
                        role,
                        is_active

                    FROM admin_users

                    WHERE id = ?

                    LIMIT 1
                `)
                .bind(userId)
                .first();


        if (!user) {

            return Response.json(
                {
                    success: false,
                    message:
                        "الموظف غير موجود"
                },
                {
                    status: 404
                }
            );

        }


        if (
            user.role ===
            "super_admin"
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "لا يمكن إيقاف المدير الرئيسي"
                },
                {
                    status: 403
                }
            );

        }


        const isActive =
            data.is_active === true ||
            data.is_active === 1 ||
            data.is_active === "1";


        await context.env.DB
            .prepare(`
                UPDATE admin_users

                SET
                    is_active = ?,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(
                isActive ? 1 : 0,
                userId
            )
            .run();


        if (!isActive) {

            await context.env.DB
                .prepare(`
                    DELETE FROM admin_sessions
                    WHERE user_id = ?
                `)
                .bind(userId)
                .run();

        }


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    isActive
                        ? "employee_enable"
                        : "employee_disable",

                action_category:
                    "employees",

                entity_type:
                    "admin_user",

                entity_id:
                    userId,

                description:
                    isActive
                        ? `تفعيل حساب الموظف: ${user.full_name}`
                        : `إيقاف حساب الموظف: ${user.full_name}`,

                old_data: {
                    is_active:
                        Number(
                            user.is_active
                        ) === 1
                },

                new_data: {
                    is_active:
                        isActive
                }
            }
        );


        return Response.json({

            success: true,

            message:
                isActive
                    ? "تم تفعيل حساب الموظف"
                    : "تم إيقاف حساب الموظف",

            id:
                userId,

            is_active:
                isActive

        });

    }

    catch (error) {

        console.error(
            "PATCH admin-users:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء تغيير حالة الموظف"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// DELETE
// حذف موظف
// ==========================================

export async function onRequestDelete(context) {

    try {

        const superAdminCheck =
            await requireSuperAdmin(context);


        if (!superAdminCheck.ok) {

            return superAdminCheck.response;

        }


        const adminAuth =
            superAdminCheck.auth;


        const url =
            new URL(
                context.request.url
            );


        const userId =
            Number(
                url.searchParams.get("id")
            );


        if (
            !userId ||
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم الموظف غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        const user =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        username,
                        full_name,
                        role,
                        is_active

                    FROM admin_users

                    WHERE id = ?

                    LIMIT 1
                `)
                .bind(userId)
                .first();


        if (!user) {

            return Response.json(
                {
                    success: false,
                    message:
                        "الموظف غير موجود"
                },
                {
                    status: 404
                }
            );

        }


        if (
            user.role ===
            "super_admin"
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "لا يمكن حذف المدير الرئيسي"
                },
                {
                    status: 403
                }
            );

        }


        // ======================================
        // حذف الجلسات
        // ======================================

        await context.env.DB
            .prepare(`
                DELETE FROM admin_sessions
                WHERE user_id = ?
            `)
            .bind(userId)
            .run();


        // ======================================
        // حذف الصلاحيات
        // ======================================

        await context.env.DB
            .prepare(`
                DELETE FROM admin_permissions
                WHERE user_id = ?
            `)
            .bind(userId)
            .run();


        // ======================================
        // حذف الموظف
        // ======================================

        await context.env.DB
            .prepare(`
                DELETE FROM admin_users
                WHERE id = ?
            `)
            .bind(userId)
            .run();


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "employee_delete",

                action_category:
                    "employees",

                entity_type:
                    "admin_user",

                entity_id:
                    userId,

                description:
                    `حذف حساب الموظف: ${user.full_name}`,

                old_data: {

                    username:
                        user.username,

                    full_name:
                        user.full_name,

                    role:
                        user.role,

                    is_active:
                        Number(
                            user.is_active
                        ) === 1

                }
            }
        );


        return Response.json({

            success: true,

            message:
                "تم حذف حساب الموظف بنجاح",

            id:
                userId

        });

    }

    catch (error) {

        console.error(
            "DELETE admin-users:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء حذف الموظف"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// التحقق من أن المستخدم Super Admin
// ==========================================

async function requireSuperAdmin(
    context
) {

    const adminCheck =
        await requireAdmin(context);


    if (!adminCheck.ok) {

        return adminCheck;

    }


    if (
        adminCheck.auth.user.role !==
        "super_admin"
    ) {

        return {

            ok: false,

            response:
                Response.json(
                    {
                        success: false,
                        message:
                            "هذه الصفحة متاحة للمدير الرئيسي فقط"
                    },
                    {
                        status: 403
                    }
                )

        };

    }


    return {

        ok: true,

        auth:
            adminCheck.auth

    };

}


// ==========================================
// حفظ صلاحيات الموظف
// ==========================================

async function savePermissions(
    context,
    userId,
    permissions
) {

    await context.env.DB
        .prepare(`
            DELETE FROM admin_permissions
            WHERE user_id = ?
        `)
        .bind(userId)
        .run();


    for (
        const permission
        of permissions
    ) {

        await context.env.DB
            .prepare(`
                INSERT OR IGNORE INTO
                admin_permissions
                (
                    user_id,
                    permission
                )

                VALUES (?, ?)
            `)
            .bind(
                userId,
                permission
            )
            .run();

    }

}


// ==========================================
// تنظيف الصلاحيات
// ==========================================

function sanitizePermissions(
    permissions
) {

    if (
        !Array.isArray(permissions)
    ) {

        return [];

    }


    return [
        ...new Set(
            permissions.filter(
                permission =>
                    ALLOWED_PERMISSIONS
                        .includes(
                            permission
                        )
            )
        )
    ];

}


// ==========================================
// تنظيف اسم المستخدم
// ==========================================

function normalizeUsername(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value
        .trim()
        .toLowerCase();

}


// ==========================================
// تنظيف النص
// ==========================================

function normalizeText(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value.trim();

}


// ==========================================
// تشفير كلمة المرور
// متوافق مع admin-login.js
// PBKDF2 SHA-256
// ==========================================

async function hashPassword(
    password
) {

    const encoder =
        new TextEncoder();


    const saltBytes =
        crypto.getRandomValues(
            new Uint8Array(16)
        );


    const passwordKey =
        await crypto.subtle
            .importKey(
                "raw",
                encoder.encode(password),
                {
                    name: "PBKDF2"
                },
                false,
                [
                    "deriveBits"
                ]
            );


    const derivedBits =
        await crypto.subtle
            .deriveBits(
                {
                    name:
                        "PBKDF2",

                    hash:
                        "SHA-256",

                    salt:
                        saltBytes,

                    iterations:
                        100000
                },
                passwordKey,
                256
            );


    const hashBytes =
        new Uint8Array(
            derivedBits
        );


    const saltHex =
        bytesToHex(
            saltBytes
        );


    const hashHex =
        bytesToHex(
            hashBytes
        );


    return `${saltHex}:${hashHex}`;

}


// ==========================================
// تحويل Bytes إلى HEX
// ==========================================

function bytesToHex(
    bytes
) {

    return Array.from(bytes)
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(2, "0")
        )
        .join("");

}
