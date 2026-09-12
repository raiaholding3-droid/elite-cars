import {
    requirePermission,
    logAdminActivity
} from "../_lib/admin-auth.js";


// =====================================
// جلب مهام المزاد
// =====================================

export async function onRequestGet(context) {

    try {

        const permissionCheck =
            await requirePermission(
                context,
                "auction_rules_view"
            );


        if (!permissionCheck.ok) {

            return permissionCheck.response;

        }


        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    ORDER BY id DESC
                `)
                .all();


        return Response.json({
            success: true,
            rules: results
        });

    }

    catch (error) {

        console.error(
            "GET /api/auction-rules:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء تحميل المهام"
            },
            {
                status: 500
            }
        );

    }

}


// =====================================
// إضافة مهمة مزاد جديدة
// =====================================

export async function onRequestPost(context) {

    try {

        const permissionCheck =
            await requirePermission(
                context,
                "auction_rules_create"
            );


        if (!permissionCheck.ok) {

            return permissionCheck.response;

        }


        const adminAuth =
            permissionCheck.auth;


        const data =
            await context.request.json();


        if (
            !data.name ||
            !data.brand
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المهمة والماركة مطلوبان"
                },
                {
                    status: 400
                }
            );

        }


        const result =
            await context.env.DB
                .prepare(`
                    INSERT INTO auction_watch_rules
                    (
                        name,
                        source_site,
                        brand,
                        model,
                        year_from,
                        year_to,
                        price_min,
                        price_max,
                        auction_house,
                        fast_buy_only,
                        enabled
                    )

                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `)
                .bind(
                    data.name,
                    "apibara",
                    data.brand,
                    data.model || null,
                    data.year_from || null,
                    data.year_to || null,
                    data.price_min || null,
                    data.price_max || null,
                    data.auction_house || null,
                    data.fast_buy_only ? 1 : 0,
                    data.enabled ? 1 : 0
                )
                .run();


        const ruleId =
            result.meta.last_row_id;


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "auction_rule_create",

                action_category:
                    "auction",

                entity_type:
                    "auction_rule",

                entity_id:
                    ruleId,

                description:
                    `إضافة مهمة مزاد: ${data.name}`,

                new_data:
                    data
            }
        );


        return Response.json(
            {
                success: true,
                id: ruleId
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        console.error(
            "POST /api/auction-rules:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء إضافة المهمة"
            },
            {
                status: 500
            }
        );

    }

}


// =====================================
// تعديل مهمة المزاد
// =====================================

export async function onRequestPut(context) {

    try {

        const permissionCheck =
            await requirePermission(
                context,
                "auction_rules_edit"
            );


        if (!permissionCheck.ok) {

            return permissionCheck.response;

        }


        const adminAuth =
            permissionCheck.auth;


        const data =
            await context.request.json();


        const id =
            Number(data.id);


        if (
            !id ||
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم المهمة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        if (
            !data.name ||
            !data.brand
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "اسم المهمة والماركة مطلوبان"
                },
                {
                    status: 400
                }
            );

        }


        const oldRule =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(id)
                .first();


        if (!oldRule) {

            return Response.json(
                {
                    success: false,
                    message:
                        "المهمة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        await context.env.DB
            .prepare(`
                UPDATE auction_watch_rules

                SET
                    name = ?,
                    source_site = ?,
                    brand = ?,
                    model = ?,
                    year_from = ?,
                    year_to = ?,
                    price_min = ?,
                    price_max = ?,
                    auction_house = ?,
                    fast_buy_only = ?,
                    enabled = ?

                WHERE id = ?
            `)
            .bind(
                data.name,
                "apibara",
                data.brand,
                data.model || null,
                data.year_from || null,
                data.year_to || null,
                data.price_min || null,
                data.price_max || null,
                data.auction_house || null,
                data.fast_buy_only ? 1 : 0,
                data.enabled ? 1 : 0,
                id
            )
            .run();


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "auction_rule_edit",

                action_category:
                    "auction",

                entity_type:
                    "auction_rule",

                entity_id:
                    id,

                description:
                    `تعديل مهمة مزاد: ${data.name}`,

                old_data:
                    oldRule,

                new_data:
                    data
            }
        );


        return Response.json({
            success: true,
            id: id
        });

    }

    catch (error) {

        console.error(
            "PUT /api/auction-rules:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء تعديل المهمة"
            },
            {
                status: 500
            }
        );

    }

}


// =====================================
// حذف مهمة مزاد
// =====================================

export async function onRequestDelete(context) {

    try {

        const permissionCheck =
            await requirePermission(
                context,
                "auction_rules_delete"
            );


        if (!permissionCheck.ok) {

            return permissionCheck.response;

        }


        const adminAuth =
            permissionCheck.auth;


        const url =
            new URL(
                context.request.url
            );


        const id =
            Number(
                url.searchParams.get("id")
            );


        if (
            !id ||
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم المهمة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        const oldRule =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(id)
                .first();


        if (!oldRule) {

            return Response.json(
                {
                    success: false,
                    message:
                        "المهمة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        await context.env.DB
            .prepare(`
                DELETE FROM auction_car_matches
                WHERE rule_id = ?
            `)
            .bind(id)
            .run();


        await context.env.DB
            .prepare(`
                DELETE FROM auction_watch_rules
                WHERE id = ?
            `)
            .bind(id)
            .run();


        await logAdminActivity(
            context,
            adminAuth,
            {
                action:
                    "auction_rule_delete",

                action_category:
                    "auction",

                entity_type:
                    "auction_rule",

                entity_id:
                    id,

                description:
                    `حذف مهمة مزاد: ${oldRule.name}`,

                old_data:
                    oldRule
            }
        );


        return Response.json({
            success: true,
            id: id
        });

    }

    catch (error) {

        console.error(
            "DELETE /api/auction-rules:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء حذف المهمة"
            },
            {
                status: 500
            }
        );

    }

}
