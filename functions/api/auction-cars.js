import {
    requirePermission,
    logAdminActivity
} from "../_lib/admin-auth.js";
// =====================================
// جلب سيارات المزاد
// =====================================

export async function onRequestGet(context) {

    try {

        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_cars
                    WHERE status = 'active'
                    ORDER BY last_seen_at DESC, id DESC
                `)
                .all();


        return Response.json({
            success: true,
            cars: results
        });

    }

    catch (error) {

        console.error(
            "خطأ جلب سيارات المزاد:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء جلب سيارات المزاد"
            },
            {
                status: 500
            }
        );

    }

}


// =====================================
// حذف سيارة مزاد نهائيًا
// =====================================

export async function onRequestDelete(context) {

    try {
                // =====================================
        // التحقق من صلاحية حذف سيارات المزاد
        // =====================================

        const permissionCheck =
            await requirePermission(
                context,
                "auction_delete"
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


        // التحقق من رقم السيارة

        if (
            !id ||
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return Response.json(
                {
                    success: false,
                    message:
                        "رقم السيارة غير صحيح"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // التأكد من وجود السيارة
        // =====================================

        const car =
            await context.env.DB
                .prepare(`
                    SELECT
                        id,
                        name
                    FROM auction_cars
                    WHERE id = ?
                    LIMIT 1
                `)
                .bind(id)
                .first();


        if (!car) {

            return Response.json(
                {
                    success: false,
                    message:
                        "السيارة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        // =====================================
        // حذف روابط السيارة مع مهام البحث
        // =====================================

        await context.env.DB
            .prepare(`
                DELETE FROM auction_car_matches
                WHERE car_id = ?
            `)
            .bind(id)
            .run();


        // =====================================
        // حذف السيارة نهائيًا
        // =====================================

        await context.env.DB
            .prepare(`
                DELETE FROM auction_cars
                WHERE id = ?
            `)
            .bind(id)
            .run();

        // =====================================
        // تسجيل العملية في سجل الإدارة
        // =====================================

        await logAdminActivity(
            context,
            adminAuth,
            {
                action: "auction_car_delete",
                action_category: "auction",
                entity_type: "auction_car",
                entity_id: id,
                description:
                    `حذف سيارة مزاد: ${car.name}`,
                old_data: car
            }
        );
        return Response.json({
            success: true,
            message:
                "تم حذف سيارة المزاد نهائيًا",
            id: id,
            name: car.name
        });

    }

    catch (error) {

        console.error(
            "خطأ حذف سيارة المزاد:",
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء حذف سيارة المزاد"
            },
            {
                status: 500
            }
        );

    }

}
