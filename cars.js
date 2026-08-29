// ==========================================
// API السيارات - Cloudflare Pages + D1
// ==========================================


// ==========================================
// جلب جميع السيارات
// GET /api/cars
// ==========================================

export async function onRequestGet(context) {

    try {

        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM cars
                    ORDER BY id DESC
                `)
                .all();


        return Response.json({
            success: true,
            cars: results
        });

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,
                message: "حدث خطأ أثناء جلب السيارات"
            },
            {
                status: 500
            }
        );

    }

}


// ==========================================
// إضافة سيارة
// POST /api/cars
// ==========================================

export async function onRequestPost(context) {

    try {

        const data =
            await context.request.json();


        // التحقق من البيانات الأساسية

        if (
            !data.name ||
            !data.brand ||
            !data.model ||
            !data.year ||
            !data.price
        ) {

            return Response.json(
                {
                    success: false,
                    message: "البيانات الأساسية للسيارة غير مكتملة"
                },
                {
                    status: 400
                }
            );

        }


        const result =
            await context.env.DB
                .prepare(`
                    INSERT INTO cars
                    (
                        name,
                        brand,
                        model,
                        year,
                        vin,
                        mileage,
                        color,
                        fuel_type,
                        body_type,
                        engine,
                        transmission,
                        price,
                        status,
                        description,
                        main_image
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `)

                .bind(
                    data.name,
                    data.brand,
                    data.model,
                    data.year,

                    data.vin || null,

                    data.mileage || null,

                    data.color || null,

                    data.fuel_type || null,

                    data.body_type || null,

                    data.engine || null,

                    data.transmission || null,

                    data.price,

                    data.status || "متوفرة",

                    data.description || null,

                    data.main_image || null
                )

                .run();


        return Response.json(
            {
                success: true,

                message:
                    "تمت إضافة السيارة بنجاح",

                id:
                    result.meta.last_row_id
            },
            {
                status: 201
            }
        );

    }

    catch (error) {

        console.error(error);

        return Response.json(
            {
                success: false,

                message:
                    "حدث خطأ أثناء إضافة السيارة"
            },
            {
                status: 500
            }
        );

    }

}